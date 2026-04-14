import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';
import leadStatusLogic from '../utils/leadStatusLogic.js';
// import { notifyLeadCreated } from '../utils/notificationTrigger.js';

// Temporary notification function until proper implementation
const notifyLeadCreated = async (leadId, assignedTo) => {
  console.log(`Notification: Lead ${leadId} created and assigned to user ${assignedTo}`);
};

export const getAllLeads = async (req, res) => {
  try {
    // Check if lead timer is enabled from system config
    const timerConfigResult = await db.query(
      `SELECT config_value FROM system_config WHERE config_key = 'lead_stage_enabled'`
    );
    const isLeadTimerEnabled = timerConfigResult.rows.length === 0 || timerConfigResult.rows[0].config_value === 'true';

    // Check which optional columns exist
    const colCheck = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN ('application_stage','converted_to_loan','stage_data','stage_history','current_landmark','our_branch','customer_id','sourcing_person_name')
    `);
    const existingCols = new Set(colCheck.rows.map(r => r.column_name));

    const optionalSelects = [
      existingCols.has('application_stage') ? `COALESCE(l.application_stage, 'SUBMITTED') as application_stage` : `'SUBMITTED' as application_stage`,
      existingCols.has('converted_to_loan') ? `COALESCE(l.converted_to_loan, false) as converted_to_loan` : `false as converted_to_loan`,
      existingCols.has('stage_data') ? `l.stage_data` : null,
      existingCols.has('stage_history') ? `l.stage_history` : null,
      existingCols.has('current_landmark') ? `l.current_landmark` : null,
      existingCols.has('our_branch') ? `l.our_branch` : null,
      existingCols.has('customer_id') ? `l.customer_id` : null,
      existingCols.has('sourcing_person_name') ? `l.sourcing_person_name` : null,
    ].filter(Boolean).join(',\n             ');

    let query = `
      SELECT l.id, l.customer_name, l.phone, l.email, l.city, l.state,
             l.vehicle_number, l.loan_amount_required, l.case_type, l.lead_type,
             l.financier_id, l.assigned_to, l.created_by, l.created_at, l.updated_at,
             l.phone as phone_no, l.vehicle_number as vehicle_no, l.city as district,
             l.current_address, l.pincode,
             ${optionalSelects},
             -- Lead conversion status
             CASE 
               WHEN ln.id IS NOT NULL THEN 'CONVERTED'
               ELSE COALESCE(l.stage, 'PENDING')
             END as lead_status,
             CASE 
               WHEN ln.id IS NOT NULL THEN 'Converted to Loan'
               WHEN l.stage = 'rejected' THEN 'Rejected'
               WHEN l.stage = 'approved' THEN 'Approved'
               WHEN l.stage = 'follow_up' THEN 'Follow Up'
               ELSE 'Pending'
             END as lead_status_label,
             CASE 
               WHEN ln.id IS NOT NULL THEN '#10B981'  -- Green for converted
               WHEN l.stage = 'rejected' THEN '#EF4444'  -- Red for rejected
               WHEN l.stage = 'approved' THEN '#059669'  -- Dark green for approved
               WHEN l.stage = 'follow_up' THEN '#F59E0B'  -- Amber for follow up
               ELSE '#6B7280'  -- Gray for pending
             END as lead_status_color,
             -- Loan application status information (only if converted)
             ln.id as loan_id,
             ln.loan_number,
             CASE 
               WHEN ln.id IS NULL THEN NULL
               ELSE COALESCE(ln.application_stage, 'SUBMITTED')
             END as loan_application_stage,
             CASE 
               WHEN ln.id IS NULL THEN NULL
               WHEN ln.application_stage = 'SUBMITTED' THEN 'Submitted'
               WHEN ln.application_stage = 'LOGIN' THEN 'Login'
               WHEN ln.application_stage = 'IN_PROCESS' THEN 'In Process'
               WHEN ln.application_stage = 'APPROVED' THEN 'Approved'
               WHEN ln.application_stage = 'REJECTED' THEN 'Rejected'
               WHEN ln.application_stage = 'DISBURSED' THEN 'Disbursed'
               WHEN ln.application_stage = 'CANCELLED' THEN 'Cancelled'
               ELSE 'Submitted'
             END as loan_application_stage_label,
             CASE 
               WHEN ln.id IS NULL THEN NULL
               WHEN ln.application_stage = 'SUBMITTED' THEN '#6B7280'
               WHEN ln.application_stage = 'LOGIN' THEN '#3B82F6'
               WHEN ln.application_stage = 'IN_PROCESS' THEN '#F59E0B'
               WHEN ln.application_stage = 'APPROVED' THEN '#10B981'
               WHEN ln.application_stage = 'REJECTED' THEN '#EF4444'
               WHEN ln.application_stage = 'DISBURSED' THEN '#059669'
               WHEN ln.application_stage = 'CANCELLED' THEN '#6B7280'
               ELSE '#6B7280'
             END as loan_application_stage_color,
             ln.stage_changed_at as loan_stage_changed_at,
             ln.created_at as loan_created_at,
             ln.loan_amount as loan_sanctioned_amount,
             ln.disbursement_date
      FROM leads l
      LEFT JOIN loans ln ON l.id = ln.lead_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (req.user.role === 'executive') {
      query += ` AND (l.assigned_to = $1 OR l.created_by = $1)`;
      params.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      query += `
        AND (
          l.assigned_to = $1
          OR l.created_by = $1
          OR l.assigned_to IN (SELECT id FROM users WHERE reporting_to = $1)
          OR l.created_by IN (SELECT id FROM users WHERE reporting_to = $1)
        )
      `;
      params.push(req.user.id);
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      // Managers/Branch Managers see only their own leads + leads from their entire team hierarchy
      query += `
        AND (
          l.assigned_to = $1
          OR l.created_by = $1
          OR l.assigned_to IN (
            WITH RECURSIVE team_hierarchy AS (
              SELECT id FROM users WHERE reporting_to = $1
              UNION ALL
              SELECT u.id FROM users u
              INNER JOIN team_hierarchy t ON u.reporting_to = t.id
            )
            SELECT id FROM team_hierarchy
          )
          OR l.created_by IN (
            WITH RECURSIVE team_hierarchy AS (
              SELECT id FROM users WHERE reporting_to = $1
              UNION ALL
              SELECT u.id FROM users u
              INNER JOIN team_hierarchy t ON u.reporting_to = t.id
            )
            SELECT id FROM team_hierarchy
          )
        )
      `;
      params.push(req.user.id);
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await db.query(query, params);
    
    // Add additional data via separate queries to avoid JOIN issues
    const enrichedRows = await Promise.all(result.rows.map(async (lead) => {
      try {
        // Get assigned user name
        let assigned_to_name = null;
        if (lead.assigned_to) {
          const userResult = await db.query('SELECT COALESCE(full_name, user_id) as name FROM users WHERE id = $1', [lead.assigned_to]);
          assigned_to_name = userResult.rows[0]?.name || null;
        }
        
        // Get creator name
        let created_by_name = null;
        if (lead.created_by) {
          const creatorResult = await db.query('SELECT COALESCE(full_name, user_id) as name FROM users WHERE id = $1', [lead.created_by]);
          created_by_name = creatorResult.rows[0]?.name || null;
        }
        
        // Get financier name
        let financier_name = null;
        if (lead.financier_id) {
          const bankResult = await db.query('SELECT name FROM banks WHERE id = $1', [lead.financier_id]);
          financier_name = bankResult.rows[0]?.name || null;
        }
        
        return {
          ...lead,
          assigned_to_name,
          created_by_name,
          financier_name,
          our_branch: lead.our_branch || 'Head Office',
          
          // Lead Status (Pending/Converted/Rejected etc.)
          lead_status: {
            stage: lead.lead_status,
            label: lead.lead_status_label,
            color: lead.lead_status_color
          },
          
          // Loan Application Status (only if converted)
          has_loan_application: !!lead.loan_id,
          is_converted_to_loan: !!lead.loan_id,
          
          loan_application_status: lead.loan_id ? {
            stage: lead.loan_application_stage,
            label: lead.loan_application_stage_label,
            color: lead.loan_application_stage_color,
            loan_id: lead.loan_id,
            loan_number: lead.loan_number,
            stage_changed_at: lead.loan_stage_changed_at,
            loan_created_at: lead.loan_created_at,
            loan_amount: lead.loan_sanctioned_amount,
            disbursement_date: lead.disbursement_date
          } : null,
          
          // Combined status for easy display
          display_status: {
            primary: {
              label: lead.lead_status_label,
              color: lead.lead_status_color,
              type: 'lead'
            },
            secondary: lead.loan_id ? {
              label: `Loan: ${lead.loan_application_stage_label}`,
              color: lead.loan_application_stage_color,
              type: 'loan',
              loan_number: lead.loan_number
            } : null
          },
          
          // Timer configuration
          timer_enabled: isLeadTimerEnabled
        };
      } catch (err) {
        console.error('Error enriching lead data:', err);
        return {
          ...lead,
          has_loan_application: false,
          is_converted_to_loan: false,
          lead_status: {
            stage: 'PENDING',
            label: 'Pending',
            color: '#6B7280'
          },
          loan_application_status: null,
          display_status: {
            primary: {
              label: 'Pending',
              color: '#6B7280',
              type: 'lead'
            },
            secondary: null
          }
        };
      }
    }));
    
    res.json(enrichedRows);
  } catch (error) {
    console.error('Get leads error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    console.log('Fetching lead with ID:', req.params.id);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    
    let query = `
      SELECT l.*, 
             l.phone as phone_no,
             l.vehicle_number as vehicle_no,
             l.city as district,
             l.current_landmark,
             COALESCE(u.full_name, u.user_id) as assigned_to_name, 
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             b.name as financier_name,
             COALESCE(l.our_branch, br.name, 'Head Office') as our_branch,
             CASE WHEN ln.id IS NOT NULL THEN true ELSE false END as converted_to_loan,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             l.stage_data,
             l.stage_history,
             -- Lead conversion status
             CASE 
               WHEN ln.id IS NOT NULL THEN 'CONVERTED'
               ELSE COALESCE(l.stage, 'PENDING')
             END as lead_status,
             CASE 
               WHEN ln.id IS NOT NULL THEN 'Converted to Loan'
               WHEN l.stage = 'rejected' THEN 'Rejected'
               WHEN l.stage = 'approved' THEN 'Approved'
               WHEN l.stage = 'follow_up' THEN 'Follow Up'
               ELSE 'Pending'
             END as lead_status_label,
             CASE 
               WHEN ln.id IS NOT NULL THEN '#10B981'
               WHEN l.stage = 'rejected' THEN '#EF4444'
               WHEN l.stage = 'approved' THEN '#059669'
               WHEN l.stage = 'follow_up' THEN '#F59E0B'
               ELSE '#6B7280'
             END as lead_status_color,
             -- Loan application status information
             ln.id as loan_id,
             ln.loan_number,
             COALESCE(ln.application_stage, 'NOT_APPLIED') as loan_application_stage,
             CASE 
               WHEN ln.application_stage IS NULL THEN 'Not Applied'
               WHEN ln.application_stage = 'SUBMITTED' THEN 'Submitted'
               WHEN ln.application_stage = 'LOGIN' THEN 'Login'
               WHEN ln.application_stage = 'IN_PROCESS' THEN 'In Process'
               WHEN ln.application_stage = 'APPROVED' THEN 'Approved'
               WHEN ln.application_stage = 'REJECTED' THEN 'Rejected'
               WHEN ln.application_stage = 'DISBURSED' THEN 'Disbursed'
               WHEN ln.application_stage = 'CANCELLED' THEN 'Cancelled'
               ELSE 'Not Applied'
             END as loan_application_stage_label,
             CASE 
               WHEN ln.application_stage IS NULL THEN '#9CA3AF'
               WHEN ln.application_stage = 'SUBMITTED' THEN '#6B7280'
               WHEN ln.application_stage = 'LOGIN' THEN '#3B82F6'
               WHEN ln.application_stage = 'IN_PROCESS' THEN '#F59E0B'
               WHEN ln.application_stage = 'APPROVED' THEN '#10B981'
               WHEN ln.application_stage = 'REJECTED' THEN '#EF4444'
               WHEN ln.application_stage = 'DISBURSED' THEN '#059669'
               WHEN ln.application_stage = 'CANCELLED' THEN '#6B7280'
               ELSE '#9CA3AF'
             END as loan_application_stage_color,
             ln.stage_changed_at as loan_stage_changed_at,
             ln.created_at as loan_created_at,
             ln.loan_amount,
             ln.sanction_amount,
             ln.disbursement_date,
             ln.roi,
             ln.tenure
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users creator ON l.created_by = creator.id
      LEFT JOIN banks b ON l.financier_id = b.id
      LEFT JOIN users cu ON l.created_by = cu.id
      LEFT JOIN branches br ON cu.branch_id = br.id
      LEFT JOIN loans ln ON l.id = ln.lead_id
      WHERE l.id = $1
    `;
    
    const params = [req.params.id];
    
    if (req.user.role === 'team_leader') {
      // Team leaders can access leads assigned to them, created by them, and leads from their team members
      query += ` AND (
        l.assigned_to = $2
        OR l.created_by = $2
        OR l.assigned_to IN (SELECT id FROM users WHERE reporting_to = $2)
        OR l.created_by IN (SELECT id FROM users WHERE reporting_to = $2)
      )`;
      params.push(req.user.id);
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      query += ` AND (
        l.assigned_to = $2
        OR l.created_by = $2
        OR l.assigned_to IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $2
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        ) OR l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $2
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
      )`;
      params.push(req.user.id);
    }
    
    const result = await db.query(query, params);
    
    console.log('Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('Lead not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const lead = result.rows[0];
    
    // Structure the response with both lead and loan status
    const responseData = {
      ...lead,
      
      // Lead Status Information
      lead_status: {
        stage: lead.lead_status,
        label: lead.lead_status_label,
        color: lead.lead_status_color
      },
      
      // Loan Application Status (only if converted)
      has_loan_application: !!lead.loan_id,
      is_converted_to_loan: !!lead.loan_id,
      
      loan_application_status: lead.loan_id ? {
        stage: lead.loan_application_stage,
        label: lead.loan_application_stage_label,
        color: lead.loan_application_stage_color,
        loan_id: lead.loan_id,
        loan_number: lead.loan_number,
        stage_changed_at: lead.loan_stage_changed_at,
        loan_created_at: lead.loan_created_at,
        loan_amount: lead.loan_amount,
        sanction_amount: lead.sanction_amount,
        disbursement_date: lead.disbursement_date,
        roi: lead.roi,
        tenure: lead.tenure
      } : null,
      
      // Status Timeline for UI
      status_timeline: {
        lead_created: lead.created_at,
        lead_status: lead.lead_status_label,
        loan_created: lead.loan_created_at,
        loan_current_stage: lead.loan_id ? lead.loan_application_stage_label : null,
        last_updated: lead.loan_stage_changed_at || lead.updated_at
      }
    };
    
    console.log('Returning lead data for ID:', req.params.id);
    res.json(responseData);
  } catch (error) {
    console.error('Get lead by ID error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

export const createLead = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT COALESCE(full_name, user_id, \'US\') as user_name FROM users WHERE id = $1', [req.user.id]);
    const userName = userResult.rows[0]?.user_name || 'User';
    const userInitials = userName.substring(0, 2).toUpperCase();
    const customerInitial = (req.body.customer_name || 'C').charAt(0).toUpperCase();

    // Use MAX of existing sequence to avoid duplicates from deleted records
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM leads WHERE created_by = $1 AND customer_id ~ '^[A-Z]{2}[A-Z]\\d+$'`,
      [req.user.id]
    );
    let seq = seqResult.rows[0]?.next_seq || 1;

    // Keep incrementing until we find a unique customer_id
    let customerId;
    let attempts = 0;
    while (attempts < 10) {
      customerId = `${userInitials}${customerInitial}${String(seq).padStart(3, '0')}`;
      const exists = await client.query('SELECT 1 FROM leads WHERE customer_id = $1', [customerId]);
      if (exists.rows.length === 0) break;
      seq++;
      attempts++;
    }
    const leadData = {
      customer_id: customerId,
      customer_name: req.body.customer_name,
      phone: req.body.phone,
      email: req.body.email,
      current_address: req.body.current_address,
      current_landmark: req.body.current_landmark,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      pan_number: req.body.pan_number,
      vehicle_number: req.body.vehicle_number,
      loan_amount_required: req.body.loan_amount_required,
      case_type: req.body.case_type,
      lead_type: req.body.lead_type,
      financier_id: req.body.financier_id,
      assigned_to: req.user.role === 'executive' ? req.user.id : req.body.assigned_to,
      created_by: req.user.id,
      sourcing_person_name: userName,
      stage: 'lead',
      status: 'new',
      application_stage: 'SUBMITTED',
      stage_data: {
        stage: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        submittedBy: req.user.id
      },
      stage_history: [{
        stage: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        submittedBy: req.user.id,
        action: 'Lead created'
      }],
      converted_to_loan: false,
      source: req.body.source,
      notes: req.body.notes,
      follow_up_date: req.body.follow_up_date
    };

    const filteredData = Object.fromEntries(
      Object.entries(leadData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );

    const { keys, values, params } = toPostgresParams(filteredData);
    const result = await client.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id, customer_id`,
      values
    );

    await client.query(
      `INSERT INTO lead_stage_history (lead_id, to_stage, changed_by) VALUES ($1, $2, $3)`,
      [result.rows[0].id, 'lead', req.user.id]
    );

    if (filteredData.assigned_to) {
      await notifyLeadCreated(result.rows[0].id, filteredData.assigned_to);
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Lead created successfully', 
      leadId: result.rows[0].id,
      customerId: result.rows[0].customer_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lead creation error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateLead = async (req, res) => {
  try {
    // If we're updating the stage, we must track the historical before/after transition
    if (req.body.stage) {
      const prev = await db.query('SELECT stage FROM leads WHERE id = $1', [req.params.id]);
      if (prev.rows.length > 0 && prev.rows[0].stage !== req.body.stage) {
        await db.query(
          `INSERT INTO lead_stage_history (lead_id, from_stage, to_stage, changed_by) VALUES ($1, $2, $3, $4)`,
          [req.params.id, prev.rows[0].stage, req.body.stage, req.user.id]
        );
      }
    }

    const { query, values } = buildUpdateQuery('leads', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    // Auto-create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id SERIAL PRIMARY KEY,
        lead_id INT NOT NULL UNIQUE,
        profile_type VARCHAR(50) DEFAULT 'salaried',
        sub_type VARCHAR(50),
        company_name VARCHAR(255),
        designation VARCHAR(255),
        current_job_experience_years NUMERIC(5,2),
        total_work_experience_years NUMERIC(5,2),
        net_monthly_salary NUMERIC(15,2),
        salary_credit_mode VARCHAR(50) DEFAULT 'account_transfer',
        salary_slip_available BOOLEAN DEFAULT false,
        business_name VARCHAR(255),
        business_vintage_years NUMERIC(5,2),
        professional_type VARCHAR(100),
        doctor_specialty VARCHAR(100),
        freelancer_type VARCHAR(100),
        practice_experience_years NUMERIC(5,2),
        itr_available BOOLEAN DEFAULT false,
        annual_income NUMERIC(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    const result = await db.query('SELECT * FROM customer_profiles WHERE lead_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const upsertCustomerProfile = async (req, res) => {
  try {
    const leadId = req.params.id;

    // Auto-create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id SERIAL PRIMARY KEY,
        lead_id INT NOT NULL UNIQUE,
        profile_type VARCHAR(50) DEFAULT 'salaried',
        sub_type VARCHAR(50),
        company_name VARCHAR(255),
        designation VARCHAR(255),
        current_job_experience_years NUMERIC(5,2),
        total_work_experience_years NUMERIC(5,2),
        net_monthly_salary NUMERIC(15,2),
        salary_credit_mode VARCHAR(50) DEFAULT 'account_transfer',
        salary_slip_available BOOLEAN DEFAULT false,
        business_name VARCHAR(255),
        business_vintage_years NUMERIC(5,2),
        professional_type VARCHAR(100),
        doctor_specialty VARCHAR(100),
        freelancer_type VARCHAR(100),
        practice_experience_years NUMERIC(5,2),
        itr_available BOOLEAN DEFAULT false,
        annual_income NUMERIC(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    const allowedFields = [
      'profile_type', 'sub_type', 'company_name', 'designation',
      'current_job_experience_years', 'total_work_experience_years',
      'net_monthly_salary', 'salary_credit_mode', 'salary_slip_available',
      'business_name', 'business_vintage_years', 'professional_type',
      'doctor_specialty', 'freelancer_type', 'practice_experience_years',
      'itr_available', 'annual_income'
    ];
    const safeBody = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowedFields.includes(k))
    );

    // Clear opposite profile type fields
    if (safeBody.profile_type === 'salaried') {
      // Clear self-employed fields
      safeBody.sub_type = null;
      safeBody.business_name = null;
      safeBody.business_vintage_years = null;
      safeBody.professional_type = null;
      safeBody.doctor_specialty = null;
      safeBody.freelancer_type = null;
      safeBody.practice_experience_years = null;
      safeBody.itr_available = false;
      safeBody.annual_income = null;
    } else if (safeBody.profile_type === 'self_employed') {
      // Clear salaried fields
      safeBody.company_name = null;
      safeBody.designation = null;
      safeBody.current_job_experience_years = null;
      safeBody.total_work_experience_years = null;
      safeBody.net_monthly_salary = null;
      safeBody.salary_credit_mode = null;
      safeBody.salary_slip_available = false;
    }

    const existing = await db.query('SELECT id FROM customer_profiles WHERE lead_id = $1', [leadId]);
    if (existing.rows.length === 0) {
      const { keys, values, params } = toPostgresParams({ ...safeBody, lead_id: leadId });
      const result = await db.query(
        `INSERT INTO customer_profiles (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
        values
      );
      return res.status(201).json({ message: 'Profile created successfully', profileId: result.rows[0].id });
    } else {
      const { query, values } = buildUpdateQuery('customer_profiles', { ...safeBody, updated_at: new Date() }, existing.rows[0].id);
      await db.query(query, values);
      return res.json({ message: 'Profile updated successfully' });
    }
  } catch (error) {
    console.error('Upsert customer profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const cloneLead = async (req, res) => {
  try {
    const originalLeadId = req.params.id;
    const { new_financier_id } = req.body;

    const result = await db.query('SELECT * FROM leads WHERE id = $1', [originalLeadId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    const lead = result.rows[0];

    // Generate new customer_id for cloned lead
    const userResult = await db.query('SELECT COALESCE(full_name, user_id, \'US\') as user_name FROM users WHERE id = $1', [req.user.id]);
    const userName = userResult.rows[0]?.user_name || 'User';
    const userInitials = userName.substring(0, 2).toUpperCase();
    const customerInitial = lead.customer_name.charAt(0).toUpperCase();
    const countResult = await db.query('SELECT COUNT(*) as count FROM leads WHERE created_by = $1', [req.user.id]);
    const leadNumber = (parseInt(countResult.rows[0].count) + 1).toString().padStart(3, '0');
    const customerId = `${userInitials}${customerInitial}${leadNumber}`;

    const leadData = {
      customer_id: customerId,
      customer_name: lead.customer_name,
      phone: lead.phone,
      email: lead.email,
      current_address: lead.current_address,
      current_landmark: lead.current_landmark,
      pincode: lead.pincode,
      city: lead.city,
      state: lead.state,
      pan_number: lead.pan_number,
      vehicle_number: lead.vehicle_number,
      loan_amount_required: lead.loan_amount_required,
      case_type: lead.case_type,
      lead_type: lead.lead_type,
      financier_id: new_financier_id || lead.financier_id,
      assigned_to: lead.assigned_to,
      created_by: req.user.id,
      stage: 'lead',
      status: 'new',
      source: 'Reapplied from Lead ' + originalLeadId,
      notes: lead.notes,
    };

    const { keys, values, params } = toPostgresParams(leadData);
    const createResult = await db.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id, customer_id`,
      values
    );
    const newLeadId = createResult.rows[0].id;

    await db.query(
      `INSERT INTO lead_stage_history (lead_id, to_stage, changed_by) VALUES ($1, $2, $3)`,
      [newLeadId, 'lead', req.user.id]
    );

    res.status(201).json({ 
      message: 'Lead cloned successfully for reapplication', 
      leadId: newLeadId,
      customerId: createResult.rows[0].customer_id
    });
  } catch (error) {
    console.error('Clone lead error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateLeadStage = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { stage: newStatus, ...statusData } = req.body;
    
    const result = await leadStatusLogic.updateLeadStatus(
      leadId,
      newStatus,
      statusData,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Update lead stage error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getLeadStatusHistory = async (req, res) => {
  try {
    const leadId = req.params.id;
    const history = await leadStatusLogic.getLeadStatusHistory(leadId);
    res.json(history);
  } catch (error) {
    console.error('Get lead status history error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getStatusStatistics = async (req, res) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      assignedTo: req.query.assignedTo
    };
    
    const stats = await leadStatusLogic.getStatusStatistics(filters);
    res.json(stats);
  } catch (error) {
    console.error('Get status statistics error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const validateStatusTransition = async (req, res) => {
  try {
    const { currentStatus, newStatus } = req.body;
    
    leadStatusLogic.validateStatusTransition(currentStatus, newStatus);
    
    res.json({ 
      valid: true, 
      message: `Transition from ${currentStatus} to ${newStatus} is valid` 
    });
  } catch (error) {
    res.status(400).json({ 
      valid: false, 
      error: error.message 
    });
  }
};
