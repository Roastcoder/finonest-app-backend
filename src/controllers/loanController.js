import db from '../config/database.js';
import { buildUpdateQuery } from '../utils/postgres.js';
import applicationStageLogic from '../utils/enhancedApplicationStageLogic.js';

// Get burst table view - all loans with their stages in one table
export const getBurstTable = async (req, res) => {
  try {
    let query = `
      SELECT 
        l.id,
        l.loan_number,
        l.applicant_name,
        l.mobile,
        l.vehicle_number,
        l.case_type,
        COALESCE(creator.full_name, creator.user_id, 'Unknown') as created_by_name,
        COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
        CASE 
          WHEN l.application_stage = 'SUBMITTED' THEN 'Submitted'
          WHEN l.application_stage = 'LOGIN' THEN 'Login'
          WHEN l.application_stage = 'IN_PROCESS' THEN 'In Process'
          WHEN l.application_stage = 'APPROVED' THEN 'Approved'
          WHEN l.application_stage = 'REJECTED' THEN 'Rejected'
          WHEN l.application_stage = 'DISBURSED' THEN 'Disbursed'
          WHEN l.application_stage = 'CANCELLED' THEN 'Cancelled'
          ELSE 'Submitted'
        END as stage_label,
        l.loan_amount,
        COALESCE(b.name, l.financier_name, 'Not Assigned') as bank_name,
        l.created_at,
        l.stage_changed_at
      FROM loans l
      LEFT JOIN users creator ON l.created_by = creator.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      WHERE COALESCE(l.application_stage, 'SUBMITTED') IN ('SUBMITTED', 'LOGIN', 'IN_PROCESS')
    `;
    
    const conditions = [];
    const values = [];
    
    // Admin hierarchy filter
    if (req.user.role === 'admin' && req.query.managerId) {
      conditions.push(`l.created_by IN (
        SELECT id FROM users WHERE reporting_to = $${values.length + 1}
        OR id IN (SELECT id FROM users WHERE reporting_to IN (
          SELECT id FROM users WHERE reporting_to = $${values.length + 1}
        ))
        OR id = $${values.length + 1}
      )`);
      values.push(req.query.managerId);
    }
    else if (req.user.role === 'executive') {
      // Executive sees loans they created OR loans converted from their leads
      conditions.push(`(
        l.created_by = $${values.length + 1}
        OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $${values.length + 1} OR assigned_to = $${values.length + 1})
      )`);
      values.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      // Team leader sirf apni loans dekhega
      conditions.push(`l.created_by = $${values.length + 1}`);
      values.push(req.user.id);
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      // Manager, DSA, and Branch Manager can see loans created by their team
      conditions.push(`(
        l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $${values.length + 1} OR dsa_id = $${values.length + 1}
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
        OR l.assigned_to = $${values.length + 1}
        OR l.created_by = $${values.length + 1}
      )`);
      values.push(req.user.id);
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await db.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get burst table error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getAllLoans = async (req, res) => {
  try {
    // Check if login stage timer is enabled from system config
    const timerConfigResult = await db.query(
      `SELECT config_value FROM system_config WHERE config_key = 'login_stage_enabled'`
    );
    const isLoginTimerEnabled = timerConfigResult.rows.length === 0 || timerConfigResult.rows[0].config_value === 'true';

    // Get login stage enabled timestamp
    const loginEnabledAtResult = await db.query(
      `SELECT config_value FROM system_config WHERE config_key = 'login_stage_enabled_at'`
    );
    const loginStageEnabledAt = loginEnabledAtResult.rows.length > 0 ? loginEnabledAtResult.rows[0].config_value : null;

    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             COALESCE(b.name, l.financier_name) as bank_name,
             br.name as broker_name,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             CASE 
               WHEN l.application_stage = 'SUBMITTED' THEN 'Submitted'
               WHEN l.application_stage = 'LOGIN' THEN 'Login'
               WHEN l.application_stage = 'IN_PROCESS' THEN 'In Process'
               WHEN l.application_stage = 'APPROVED' THEN 'Approved'
               WHEN l.application_stage = 'REJECTED' THEN 'Rejected'
               WHEN l.application_stage = 'DISBURSED' THEN 'Disbursed'
               WHEN l.application_stage = 'CANCELLED' THEN 'Cancelled'
               ELSE 'Submitted'
             END as application_stage_label,
             CASE 
               WHEN l.application_stage = 'SUBMITTED' THEN '#6B7280'
               WHEN l.application_stage = 'LOGIN' THEN '#3B82F6'
               WHEN l.application_stage = 'IN_PROCESS' THEN '#F59E0B'
               WHEN l.application_stage = 'APPROVED' THEN '#10B981'
               WHEN l.application_stage = 'REJECTED' THEN '#EF4444'
               WHEN l.application_stage = 'DISBURSED' THEN '#059669'
               WHEN l.application_stage = 'CANCELLED' THEN '#6B7280'
               ELSE '#6B7280'
             END as application_stage_color,
             l.app_score,
             l.credit_score,
             l.tags,
             l.roi,
             l.loan_account_number,
             l.rc_type,
             l.rc_collected_by,
             l.rto_agent_name_rc,
             l.rto_agent_mobile,
             l.banker_name,
             l.banker_mobile,
             l.stage_changed_at,
             l.stage_data,
             l.stage_history,
             l.link_loan_checked,
             l.link_loan_tag,
             l.link_loan_data,
             l.bureau_score,
             l.credit_report_data
      FROM loans l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users creator ON l.created_by = creator.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      LEFT JOIN brokers br ON COALESCE(l.assigned_broker_id, l.broker_id) = br.id
    `;
    
    const conditions = [];
    const values = [];
    
    // Filter by application stage if provided
    if (req.query.application_stage) {
      conditions.push('l.application_stage = $' + (values.length + 1));
      values.push(req.query.application_stage);
    }
    
    // Admin hierarchy filter
    if (req.user.role === 'admin' && req.query.managerId) {
      conditions.push(`l.created_by IN (
        SELECT id FROM users WHERE reporting_to = $${values.length + 1}
        OR id IN (SELECT id FROM users WHERE reporting_to IN (
          SELECT id FROM users WHERE reporting_to = $${values.length + 1}
        ))
        OR id = $${values.length + 1}
      )`);
      values.push(req.query.managerId);
    }
    else if (req.user.role === 'executive') {
      // Executive sees loans they created OR loans converted from their leads
      conditions.push(`(
        l.created_by = $1
        OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $1 OR assigned_to = $1)
      )`);
      values.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      // Team leader sirf apni loans dekhega
      conditions.push('l.created_by = $1');
      values.push(req.user.id);
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      // Manager, DSA, and Branch Manager can see loans created by their team
      conditions.push(`(
        l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $1 OR dsa_id = $1
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
        OR l.assigned_to = $1
        OR l.created_by = $1
      )`);
      values.push(req.user.id);
    }
    // Admin/others ke liye koi filter nahi
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await db.query(query, values);
    
    // Process results to ensure proper stage information
    const processedRows = result.rows.map(row => ({
      ...row,
      application_stage: row.application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      application_stage_label: row.application_stage_label || 'Submitted',
      application_stage_color: row.application_stage_color || applicationStageLogic.STAGE_COLORS.SUBMITTED,
      timer_enabled: isLoginTimerEnabled,
      login_stage_enabled_at: loginStageEnabledAt
    }));
    
    return res.json(processedRows);
  } catch (error) {
    console.error('Get loans error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    console.log('Fetching loan with ID:', req.params.id);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             COALESCE(b.name, l.financier_name) as bank_name,
             br.name as broker_name,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             CASE 
               WHEN l.application_stage = 'SUBMITTED' THEN 'Submitted'
               WHEN l.application_stage = 'LOGIN' THEN 'Login'
               WHEN l.application_stage = 'IN_PROCESS' THEN 'In Process'
               WHEN l.application_stage = 'APPROVED' THEN 'Approved'
               WHEN l.application_stage = 'REJECTED' THEN 'Rejected'
               WHEN l.application_stage = 'DISBURSED' THEN 'Disbursed'
               WHEN l.application_stage = 'CANCELLED' THEN 'Cancelled'
               ELSE 'Submitted'
             END as application_stage_label,
             l.app_score,
             l.credit_score,
             l.tags,
             l.roi,
             l.loan_account_number,
             l.rc_type,
             l.rc_collected_by,
             l.rto_agent_name_rc,
             l.rto_agent_mobile,
             l.banker_name,
             l.banker_mobile,
             l.stage_changed_at,
             l.stage_data,
             l.stage_history,
             l.rejection_remarks,
             l.cancellation_remarks,
             l.remark,
             l.link_loan_checked,
             l.link_loan_tag,
             l.link_loan_data
      FROM loans l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users creator ON l.created_by = creator.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      LEFT JOIN brokers br ON COALESCE(l.assigned_broker_id, l.broker_id) = br.id
      WHERE l.id = $1
    `;
    
    const values = [req.params.id];
    
    // Apply role-based filtering for loan detail view
    if (req.user.role === 'executive') {
      query += ` AND (
        l.created_by = $2
        OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $2 OR assigned_to = $2)
      )`;
      values.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      query += ' AND l.created_by = $2';
      values.push(req.user.id);
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      query += ` AND (
        l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $2 OR dsa_id = $2
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
        OR l.assigned_to = $2
        OR l.created_by = $2
      )`;
      values.push(req.user.id);
    }
    
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await db.query(query, values);
    
    console.log('Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('Loan not found or access denied for ID:', req.params.id);
      return res.status(404).json({ error: 'Loan not found or access denied' });
    }
    
    console.log('Returning loan data for ID:', req.params.id);
    
    // Process result to ensure proper stage information
    const processedLoan = {
      ...result.rows[0],
      application_stage: result.rows[0].application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      application_stage_label: result.rows[0].application_stage_label || 'Submitted'
    };
    
    res.json(processedLoan);
  } catch (error) {
    console.error('Get loan by ID error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

export const createLoan = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    console.log('=== LOAN CREATION REQUEST ===');
    console.log('Request body lead_id:', req.body.lead_id);
    console.log('Request body customer_id:', req.body.customer_id);
    console.log('User:', req.user.id);
    console.log('============================');
    
    // Get user details
    const userResult = await client.query(
      'SELECT id, full_name FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    const initials = (user.full_name || 'XX').substring(0, 2).toUpperCase();
    const userId = String(user.id).padStart(4, '0');
    
    // Get next sequence for this user
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM loans 
       WHERE created_by = $1`,
      [req.user.id]
    );
    
    const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
    const loanId = req.body.loan_number || `${initials}-${userId}-${sequence}`;
    
    // Get existing columns from loans table
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans'
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    console.log('Available columns:', existingColumns.length);
    
    // Create comprehensive loan data object with all frontend fields
    const loanData = {
      lead_id: req.body.lead_id || null,
      loan_number: loanId,
      customer_id: req.body.customer_id || null,
      applicant_name: req.body.applicant_name || null,
      customer_name: req.body.applicant_name || req.body.customer_name || null,
      mobile: req.body.mobile || null,
      phone: req.body.mobile || req.body.phone || null,
      email: req.body.email || null,
      co_applicant_name: req.body.co_applicant_name || null,
      co_applicant_mobile: req.body.co_applicant_mobile || null,
      guarantor_name: req.body.guarantor_name || null,
      guarantor_mobile: req.body.guarantor_mobile || null,
      current_address: req.body.current_address || null,
      current_landmark: req.body.current_landmark || req.body.landmark || null,
      landmark: req.body.current_landmark || req.body.landmark || null,
      current_village: req.body.current_village || null,
      current_tehsil: req.body.current_tehsil || null,
      current_district: req.body.current_district || null,
      current_state: req.body.current_state || null,
      current_pincode: req.body.current_pincode || null,
      permanent_address: req.body.permanent_address || null,
      permanent_village: req.body.permanent_village || null,
      permanent_tehsil: req.body.permanent_tehsil || null,
      permanent_district: req.body.permanent_district || null,
      permanent_state: req.body.permanent_state || null,
      permanent_pincode: req.body.permanent_pincode || null,
      our_branch: req.body.our_branch || null,
      income_source: req.body.income_source || null,
      monthly_income: req.body.monthly_income || null,
      company_name: req.body.company_name || null,
      designation: req.body.designation || null,
      work_experience: req.body.work_experience || null,
      current_job_years: req.body.current_job_years || null,
      total_work_exp: req.body.total_work_exp || null,
      net_monthly_salary: req.body.net_monthly_salary || null,
      salary_credit_mode: req.body.salary_credit_mode || null,
      salary_slip_available: req.body.salary_slip_available || null,
      profile: req.body.profile || null,
      itr_available: req.body.itr_available || null,
      annual_income_itr: req.body.annual_income_itr || null,
      business_name: req.body.business_name || null,
      business_type: req.body.business_type || null,
      business_vintage: req.body.business_vintage || null,
      professional_subtype: req.body.professional_subtype || null,
      practice_experience: req.body.practice_experience || null,
      freelancer_subtype: req.body.freelancer_subtype || null,
      other_income_type: req.body.other_income_type || null,
      selected_financier: req.body.selected_financier || null,
      financier_location: req.body.financier_location || null,
      loan_amount: req.body.loan_amount || 0,
      application_stage: applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      ltv: req.body.ltv || null,
      loan_type_vehicle: req.body.loan_type_vehicle || null,
      vehicle_number: req.body.vehicle_number || null,
      case_type: req.body.case_type || null,
      engine_number: req.body.engine_number || null,
      chassis_number: req.body.chassis_number || null,
      owner_name: req.body.owner_name || null,
      maker_name: req.body.maker_name || null,
      maker_description: req.body.maker_description || null,
      maker_model: req.body.maker_model || null,
      model_variant_name: req.body.model_variant_name || null,
      fuel_type: req.body.fuel_type || null,
      manufacturing_date: req.body.manufacturing_date || null,
      ownership_type: req.body.ownership_type || null,
      financer: req.body.financer || null,
      finance_status: req.body.finance_status || null,
      insurance_company: req.body.insurance_company || null,
      insurance_valid_upto: req.body.insurance_valid_upto || null,
      pucc_valid_upto: req.body.pucc_valid_upto || null,
      vertical: req.body.vertical || null,
      scheme: req.body.scheme || null,
      emi_amount: req.body.emi_amount || req.body.emi || null,
      emi: req.body.emi || req.body.emi_amount || null,
      total_emi: req.body.total_emi || null,
      total_interest: req.body.total_interest || null,
      irr: req.body.irr || null,
      interest_rate: req.body.irr || req.body.interest_rate || null,
      tenure: req.body.tenure || null,
      emi_start_date: req.body.emi_start_date || null,
      emi_end_date: req.body.emi_end_date || null,
      processing_fee: req.body.processing_fee || null,
      assigned_bank_id: req.body.assigned_bank_id || null,
      bank_id: req.body.assigned_bank_id || req.body.bank_id || null,
      assigned_broker_id: req.body.assigned_broker_id || null,
      broker_id: req.body.assigned_broker_id || req.body.broker_id || null,
      financier_name: req.body.financier_name || null,
      financier_branch_name: req.body.financier_branch_name || null,
      financier_executive_name: req.body.financier_executive_name || null,
      financier_executive_mobile: req.body.financier_executive_mobile || null,
      financier_area_manager_name: req.body.financier_area_manager_name || null,
      financier_area_manager_mobile: req.body.financier_area_manager_mobile || null,
      sanction_amount: req.body.sanction_amount || null,
      sanction_date: req.body.sanction_date || null,
      insurance_company_name: req.body.insurance_company_name || null,
      premium_amount: req.body.premium_amount || null,
      insurance_date: req.body.insurance_date || null,
      insurance_policy_number: req.body.insurance_policy_number || null,
      total_deduction: req.body.total_deduction || null,
      net_disbursement_amount: req.body.net_disbursement_amount || null,
      payment_received_date: req.body.payment_received_date || null,
      rc_owner_name: req.body.rc_owner_name || null,
      existing_loan_status: req.body.existing_loan_status || null,
      existing_loan_amount: req.body.existing_loan_amount ? Number(req.body.existing_loan_amount) : null,
      existing_tenure: req.body.existing_tenure ? Number(req.body.existing_tenure) : null,
      existing_emi: req.body.existing_emi ? Number(req.body.existing_emi) : null,
      no_of_emi_paid: req.body.no_of_emi_paid ? Number(req.body.no_of_emi_paid) : null,
      bouncing_3_months: req.body.bouncing_last_3m != null ? Number(req.body.bouncing_last_3m) : (req.body.bouncing_3_months != null ? Number(req.body.bouncing_3_months) : null),
      bouncing_6_months: req.body.bouncing_last_6m != null ? Number(req.body.bouncing_last_6m) : (req.body.bouncing_6_months != null ? Number(req.body.bouncing_6_months) : null),
      rto_agent_name: req.body.rto_agent_name || null,
      agent_mobile_no: req.body.agent_mobile_no || null,
      login_date: req.body.login_date || null,
      approval_date: req.body.approval_date || null,
      sourcing_person_name: req.body.sourcing_person_name || null,
      remark: req.body.remark || null,
      status: req.body.status || 'pending',
      application_stage: req.body.application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      disbursement_date: req.body.disbursement_date || null,
      pdd: req.body.pdd || null,
      assigned_to: req.body.assigned_to || null,
      created_by: req.user.id,
      created_at: new Date(), // Ensure fresh timestamp
      stage_changed_at: new Date() // Ensure fresh stage timestamp
    };
    
    // Filter: remove undefined AND columns that don't exist in table
    const filteredData = Object.fromEntries(
      Object.entries(loanData)
        .filter(([key, value]) => value !== undefined && existingColumns.includes(key))
    );
    
    const keys = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await client.query(
      `INSERT INTO loans (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id, loan_number`,
      values
    );
    
    // If loan was created from a lead, mark the lead as converted
    if (filteredData.lead_id) {
      console.log(`Marking lead ${filteredData.lead_id} as converted...`);
      const updateResult = await client.query(
        'UPDATE leads SET converted_to_loan = true, loan_created_at = NOW(), application_stage = \'DISBURSED\' WHERE id = $1 RETURNING id, customer_name, converted_to_loan',
        [filteredData.lead_id]
      );
      if (updateResult.rows.length > 0) {
        console.log(`✅ Lead ${filteredData.lead_id} (${updateResult.rows[0].customer_name}) marked as converted:`, updateResult.rows[0].converted_to_loan);
      } else {
        console.log(`⚠️ Lead ${filteredData.lead_id} not found in database`);
      }
    } else {
      console.log('No lead_id provided - this is a direct loan creation');
    }
    
    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Loan created successfully', 
      id: result.rows[0].id,
      loan_number: result.rows[0].loan_number 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('=== LOAN CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('User:', req.user);
    console.error('========================');
    res.status(500).json({ 
      error: error.message,
      details: error.code || 'Unknown error',
      hint: error.hint || null
    });
  } finally {
    client.release();
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLoan = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const loanId = req.params.id;
    
    // Get existing columns from loans table
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans'
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    
    // Build update data with all possible fields
    const updateData = {
      existing_loan_status: req.body.existing_loan_status !== undefined ? req.body.existing_loan_status : undefined,
      existing_loan_amount: req.body.existing_loan_amount !== undefined ? Number(req.body.existing_loan_amount) : undefined,
      existing_tenure: req.body.existing_tenure !== undefined ? Number(req.body.existing_tenure) : undefined,
      existing_emi: req.body.existing_emi !== undefined ? Number(req.body.existing_emi) : undefined,
      no_of_emi_paid: req.body.no_of_emi_paid !== undefined ? Number(req.body.no_of_emi_paid) : undefined,
      bouncing_3_months: req.body.bouncing_3_months !== undefined ? Number(req.body.bouncing_3_months) : undefined,
      bouncing_6_months: req.body.bouncing_6_months !== undefined ? Number(req.body.bouncing_6_months) : undefined,
      applicant_name: req.body.applicant_name,
      mobile: req.body.mobile,
      email: req.body.email,
      co_applicant_name: req.body.co_applicant_name,
      co_applicant_mobile: req.body.co_applicant_mobile,
      guarantor_name: req.body.guarantor_name,
      guarantor_mobile: req.body.guarantor_mobile,
      current_address: req.body.current_address,
      current_landmark: req.body.current_landmark,
      current_district: req.body.current_district,
      current_state: req.body.current_state,
      current_pincode: req.body.current_pincode,
      vehicle_number: req.body.vehicle_number,
      maker_name: req.body.maker_name,
      model_variant_name: req.body.model_variant_name,
      engine_number: req.body.engine_number,
      chassis_number: req.body.chassis_number,
      owner_name: req.body.owner_name,
      fuel_type: req.body.fuel_type,
      manufacturing_date: req.body.manufacturing_date,
      ownership_type: req.body.ownership_type,
      financer: req.body.financer,
      finance_status: req.body.finance_status,
      insurance_company: req.body.insurance_company,
      insurance_valid_upto: req.body.insurance_valid_upto,
      pucc_valid_upto: req.body.pucc_valid_upto,
      case_type: req.body.case_type,
      emi_amount: req.body.emi_amount,
      tenure: req.body.tenure,
      total_interest: req.body.total_interest,
      loan_amount: req.body.loan_amount,
      selected_financier: req.body.selected_financier,
      financier_location: req.body.financier_location,
      financier_name: req.body.financier_name,
      insurance_company_name: req.body.insurance_company_name,
      premium_amount: req.body.premium_amount,
      total_deduction: req.body.total_deduction,
      net_disbursement_amount: req.body.net_disbursement_amount,
      payment_received_date: req.body.payment_received_date,
      rc_owner_name: req.body.rc_owner_name,
      rto_agent_name: req.body.rto_agent_name,
      agent_mobile_no: req.body.agent_mobile_no,
      login_date: req.body.login_date,
      approval_date: req.body.approval_date,
      assigned_to: req.body.assigned_to,
      // Income fields
      income_source: req.body.income_source,
      monthly_income: req.body.monthly_income !== undefined ? (req.body.monthly_income ? Number(req.body.monthly_income) : null) : undefined,
      company_name: req.body.company_name,
      designation: req.body.designation,
      work_experience: req.body.work_experience,
      current_job_years: req.body.current_job_years,
      total_work_exp: req.body.total_work_exp,
      net_monthly_salary: req.body.net_monthly_salary !== undefined ? (Number(req.body.net_monthly_salary) || null) : undefined,
      salary_credit_mode: req.body.salary_credit_mode,
      salary_slip_available: req.body.salary_slip_available,
      profile: req.body.profile,
      itr_available: req.body.itr_available,
      annual_income_itr: req.body.annual_income_itr !== undefined ? (Number(req.body.annual_income_itr) || null) : undefined,
      business_name: req.body.business_name,
      business_type: req.body.business_type,
      business_vintage: req.body.business_vintage,
      professional_subtype: req.body.professional_subtype,
      practice_experience: req.body.practice_experience,
      freelancer_subtype: req.body.freelancer_subtype,
      other_income_type: req.body.other_income_type,
      our_branch: req.body.our_branch,
      sourcing_person_name: req.body.sourcing_person_name,
      remark: req.body.remark,
    };
    
    // Filter: remove undefined AND columns that don't exist in table
    const filteredData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([key, value]) => value !== undefined && existingColumns.includes(key))
    );
    
    if (Object.keys(filteredData).length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Build SET clause
    const setClause = Object.keys(filteredData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const values = [...Object.values(filteredData), loanId];
    
    const result = await client.query(
      `UPDATE loans SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Loan updated successfully', loan: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update loan error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Update Loan Application Stage
export const updateLoanApplicationStage = async (req, res) => {
  try {
    // Additional check for team leaders
    if (req.user.role === 'team_leader') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Team leaders cannot update loan application status. Please contact your manager.'
      });
    }
    
    const loanId = req.params.id;
    const { stage: newStage, ...stageData } = req.body;
    
    const result = await applicationStageLogic.updateLoanApplicationStage(
      loanId,
      newStage,
      stageData,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Update loan application stage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Loan Application Stage History
export const getLoanApplicationStageHistory = async (req, res) => {
  try {
    const loanId = req.params.id;
    const history = await applicationStageLogic.getLoanStageHistory(loanId);
    res.json(history);
  } catch (error) {
    console.error('Get loan application stage history error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateLoanStage = async (req, res) => {
  try {
    const loanId = req.params.id;
    const stageData = req.body;
    
    console.log('Updating loan stage:', { loanId, stageData });
    
    // Validate required fields
    if (!stageData.stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }

    // DISBURSED: enforce link_loan_checked
    if (stageData.stage === 'DISBURSED') {
      const loanCheck = await db.query('SELECT link_loan_checked FROM loans WHERE id = $1', [loanId]);
      const llc = loanCheck.rows[0]?.link_loan_checked;
      if (!llc || !['Yes', 'No'].includes(llc)) {
        return res.status(400).json({
          error: 'Link Loan Checked (Yes/No) is mandatory before marking a case as Disbursed.',
          code: 'LINK_LOAN_CHECK_REQUIRED'
        });
      }
    }
    
    // Get current loan data
    const currentLoan = await db.query(
      'SELECT application_stage, stage_history, stage_data FROM loans WHERE id = $1', 
      [loanId]
    );
    
    if (currentLoan.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Parse existing history (handle both string and object formats)
    let currentHistory = [];
    try {
      const historyData = currentLoan.rows[0]?.stage_history;
      if (historyData) {
        currentHistory = typeof historyData === 'string' ? JSON.parse(historyData) : historyData;
        if (!Array.isArray(currentHistory)) {
          currentHistory = [];
        }
      }
    } catch (parseError) {
      console.log('Error parsing stage_history, starting with empty array:', parseError.message);
      currentHistory = [];
    }
    
    // Create new stage entry with IST timestamp
    const istTime = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString();
    const newStageEntry = {
      ...stageData,
      updatedAt: istTime,
      updatedBy: req.user.id
    };
    
    // Add new stage to history
    const updatedHistory = [...currentHistory, newStageEntry];
    
    console.log('Updating with data:', {
      stage: stageData.stage,
      stageData: newStageEntry,
      historyLength: updatedHistory.length
    });
    
    // Build extra column updates for stage-specific fields
    const extraCols = ['stage_changed_at'];
    const extraVals = [istTime];

    if (stageData.stage === 'LOGIN') {
      const appScore = stageData.appScore || stageData.app_score || null;
      const creditScore = stageData.creditScore || stageData.credit_score || null;
      const istLoginDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString();
      
      extraCols.push('app_score', 'credit_score', 'login_date');
      extraVals.push(appScore, creditScore, stageData.loginDate || istLoginDate);

      // Fire-and-forget: fetch credit report from Neokred and save all data + auto link loan tag
      (async () => {
        try {
          const loanR = await db.query(
            'SELECT applicant_name, mobile, vehicle_number, selected_financier, financier_name FROM loans WHERE id = $1',
            [loanId]
          );
          if (!loanR.rows.length) return;
          const loan = loanR.rows[0];
          const name = (loan.applicant_name || '').trim();
          const mobile = (loan.mobile || '').trim();
          const rcUpper = (loan.vehicle_number || '').toUpperCase().trim();
          if (!name || !mobile) return;

          const nameParts = name.split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Check 90-day cache first
          let creditData = null;
          if (rcUpper) {
            const cached = await db.query(
              `SELECT credit_data FROM experian_credit_cache WHERE rc_number = $1 AND fetched_at > NOW() - INTERVAL '90 days'`,
              [rcUpper]
            );
            if (cached.rows.length > 0) creditData = cached.rows[0].credit_data;
          }

          // Fetch fresh if not cached
          if (!creditData) {
            const { default: axios } = await import('axios');
            const NEOKRED_URL = `${process.env.KYC_BASE_URL || 'https://profilex-api.neokred.tech'}/core-svc/api/v2/exp/experian-credit-report`;
            const resp = await axios.post(NEOKRED_URL,
              { mobile_no: mobile, first_name: firstName, last_name: lastName },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'client-user-id': process.env.KYC_CLIENT_USER_ID || '',
                  'secret-key': process.env.KYC_SECRET_KEY || '',
                  'access-key': process.env.KYC_ACCESS_KEY || '',
                },
                timeout: 30000
              }
            );
            creditData = resp.data;
            // Save to cache
            if (rcUpper) {
              await db.query(
                `INSERT INTO experian_credit_cache (rc_number, mobile, first_name, last_name, credit_data, fetched_at, fetched_by)
                 VALUES ($1,$2,$3,$4,$5,NOW(),$6)
                 ON CONFLICT (rc_number) DO UPDATE SET credit_data=$5, fetched_at=NOW(), fetched_by=$6`,
                [rcUpper, mobile, firstName, lastName, JSON.stringify(creditData), req.user.id]
              ).catch(() => {});
            }
          }

          // Extract credit score
          const bureauScore = Number(creditData?.data?.result?.SCORE?.BureauScore || 0) || null;

          // Extract all auto loans
          const AUTO_TYPES = new Set(['01','1','13','17','32','33','34']);
          const details = creditData?.data?.result?.CAIS_Account?.CAIS_Account_DETAILS || [];
          const accountsList = Array.isArray(details) ? details : [details];
          const autoLoans = accountsList.filter(a => {
            if (!a) return false;
            const t = String(a.Account_Type || '');
            return AUTO_TYPES.has(t) || AUTO_TYPES.has(t.replace(/^0+/, ''));
          }).map(a => ({
            account_number: a.Account_Number || '',
            subscriber_name: a.Subscriber_Name || '',
            account_type: a.Account_Type || '',
            sanctioned_amount: Number(a.Highest_Credit_or_Original_Loan_Amount || 0),
            current_balance: Number(a.Current_Balance || 0),
            account_status: String(a.Account_Status) === '11' ? 'Active' : 'Closed',
          }));

          // Auto link loan detection:
          // A link loan exists when the selected financier has MORE THAN ONE auto loan
          // (meaning the same lender financed multiple vehicles for this customer)
          const selectedFinancier = (loan.selected_financier || loan.financier_name || '').toLowerCase().trim();
          let hasLinkLoan = false;
          if (selectedFinancier && autoLoans.length > 0) {
            // Find loans from the selected financier
            const financierLoans = autoLoans.filter(al => {
              const lender = (al.subscriber_name || '').toLowerCase().trim();
              const lenderWords = lender.split(/\s+/).filter(w => w.length >= 4);
              const financierWords = selectedFinancier.split(/\s+/).filter(w => w.length >= 4);
              return lenderWords.some(lw => financierWords.some(fw => lw.includes(fw) || fw.includes(lw)));
            });
            // Link loan = same lender has 2+ loans
            hasLinkLoan = financierLoans.length > 1;
          }

          // Parse full report into frontend-expected format
          const result = creditData?.data?.result || {};
          const allDetails = result?.CAIS_Account?.CAIS_Account_DETAILS || [];
          const allAccounts = Array.isArray(allDetails) ? allDetails : [allDetails];
          const firstHolder = allAccounts[0]?.CAIS_Holder_Details?.[0] || {};
          const firstPhone = allAccounts[0]?.CAIS_Holder_Phone_Details?.[0] || {};
          const fmtD = (raw) => { if (!raw) return ''; const s = String(raw).replace(/-/g,''); if (s.length!==8) return String(raw); return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`; };
          const ATYPE = {
            '01':'AUTO LOAN','1':'AUTO LOAN',
            '02':'HOME LOAN','2':'HOME LOAN',
            '03':'PROPERTY LOAN','3':'PROPERTY LOAN',
            '04':'LOAN AGAINST SHARES','4':'LOAN AGAINST SHARES',
            '05':'PERSONAL LOAN','5':'PERSONAL LOAN',
            '06':'CONSUMER LOAN','6':'CONSUMER LOAN',
            '07':'GOLD LOAN','7':'GOLD LOAN',
            '08':'EDUCATION LOAN','8':'EDUCATION LOAN',
            '09':'LOAN TO PROFESSIONAL','9':'LOAN TO PROFESSIONAL',
            '10':'CREDIT CARD','10':'CREDIT CARD',
            '11':'LEASING','11':'LEASING',
            '12':'OVERDRAFT','12':'OVERDRAFT',
            '13':'TWO-WHEELER LOAN',
            '14':'KISAN CREDIT CARD',
            '15':'COMMERCIAL VEHICLE LOAN',
            '16':'FLEET CARD',
            '17':'COMMERCIAL VEHICLE LOAN',
            '19':'SECURED CREDIT CARD',
            '32':'USED CAR LOAN',
            '33':'CONSTRUCTION EQUIPMENT LOAN',
            '34':'TRACTOR LOAN',
            '35':'STAFF LOAN',
            '51':'BUSINESS LOAN',
            '52':'BUSINESS LOAN - SMALL',
            '53':'BUSINESS LOAN - AGRICULTURE',
            '61':'BUSINESS LOAN - UNSECURED',
            '69':'SHORT TERM PERSONAL LOAN',
            '00':'OTHERS'
          };
          const parsedFullReport = {
            personal: {
              name: firstHolder.Surname_Non_Normalized || '',
              dob: fmtD(firstHolder.Date_of_birth),
              gender: firstHolder.Gender_Code === '1' ? 'Male' : firstHolder.Gender_Code === '2' ? 'Female' : '',
              pan: firstHolder.Income_TAX_PAN || '',
              mobile: firstPhone.Mobile_Telephone_Number || firstPhone.Telephone_Number || '',
              email: firstPhone.EMailId || '',
            },
            accounts: allAccounts.filter(Boolean).map(a => ({
              account_number: a.Account_Number || '',
              subscriber_name: a.Subscriber_Name || '',
              account_type: ATYPE[String(a.Account_Type)] || `Type ${a.Account_Type}`,
              account_status: String(a.Account_Status) === '11' ? 'Active' : 'Closed',
              sanctioned_amount: Number(a.Highest_Credit_or_Original_Loan_Amount || 0),
              current_balance: Number(a.Current_Balance || 0),
              amount_overdue: Number(a.Amount_Past_Due || 0),
              emi_amount: Number(a.Scheduled_Monthly_Payment_Amount || 0),
              open_date: fmtD(a.Open_Date),
              close_date: fmtD(a.Date_Closed),
              date_of_last_payment: fmtD(a.Date_of_Last_Payment),
              date_reported: fmtD(a.Date_Reported),
              account_holder_type: String(a.AccountHoldertypeCode) === '1' ? 'Individual' : (a.AccountHoldertypeCode || ''),
              payment_history: (Array.isArray(a.CAIS_Account_History) ? a.CAIS_Account_History : [a.CAIS_Account_History]).filter(Boolean).map(h => ({
                month: `${String(h.Month||'').padStart(2,'0')}/${h.Year||''}`,
                days_past_due: Number(h.Days_Past_Due || 0),
                asset_classification: h.Asset_Classification || '',
              })),
            })),
            enquiries: [],
          };

          // Save parsed data to loan
          await db.query(
            `UPDATE loans SET
               bureau_score = $1,
               credit_report_data = $2,
               link_loan_checked = 'Yes',
               link_loan_tag = $3,
               link_loan_data = $4,
               updated_at = NOW()
             WHERE id = $5`,
            [
              bureauScore,
              JSON.stringify({ credit_score: bureauScore, auto_loans: autoLoans, full_report: parsedFullReport, fetched_at: new Date().toISOString() }),
              hasLinkLoan ? 'LINK LOAN EXIST' : null,
              JSON.stringify({ auto_loans: autoLoans, financier_checked: selectedFinancier, fetched_at: new Date().toISOString() }),
              loanId
            ]
          ).catch(err => console.error('Save credit data error:', err.message));

          console.log(`✅ LOGIN credit fetch done for loan ${loanId}: score=${bureauScore}, autoLoans=${autoLoans.length}, linkLoan=${hasLinkLoan}`);
        } catch (err) {
          console.error(`❌ LOGIN credit fetch failed for loan ${loanId}:`, err.message);
        }
      })();

      console.log('LOGIN stage - Scores updated:', { appScore, creditScore });
    } else if (stageData.stage === 'IN_PROCESS') {
      extraCols.push('tags');
      extraVals.push(stageData.tags || []);
    } else if (stageData.stage === 'APPROVED') {
      extraCols.push('roi', 'tenure', 'approval_remarks');
      extraVals.push(stageData.roi || null, stageData.tenure || null, stageData.loanAmount ? `Approved amount: ${stageData.loanAmount}` : null);
    } else if (stageData.stage === 'DISBURSED') {
      const istDisbursementDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString();
      extraCols.push('roi', 'tenure', 'loan_account_number', 'rc_type', 'rc_collected_by', 'disbursement_date', 'rto_agent_name_rc', 'rto_agent_mobile', 'banker_name', 'banker_mobile');
      extraVals.push(stageData.roi || null, stageData.tenure || null, stageData.loanAccountNumber || null, stageData.rcType || null, stageData.collectedBy || null, istDisbursementDate, stageData.agentName || null, stageData.agentMobile || null, stageData.bankerName || null, stageData.bankerMobile || null);
    } else if (stageData.stage === 'REJECTED') {
      extraCols.push('rejection_remarks');
      extraVals.push(stageData.remarks || null);
    } else if (stageData.stage === 'CANCELLED') {
      extraCols.push('cancellation_remarks');
      extraVals.push(stageData.remarks || null);
    }

    // Base params: $1=stage, $2=stage_data, $3=stage_history, then extra cols, last=loanId
    const baseVals = [stageData.stage, newStageEntry, updatedHistory, ...extraVals, loanId];
    const extraSetClauses = extraCols.map((col, i) => `${col} = $${i + 4}`).join(', ');
    const idParam = `$${baseVals.length}`;
    const extraSet = extraSetClauses ? `, ${extraSetClauses}` : '';

    // Update the loan's current stage with stage_changed_at timestamp
    const updateResult = await db.query(
      `UPDATE loans 
       SET application_stage = $1, 
           stage_data = $2, 
           stage_history = $3
           ${extraSet},
           updated_at = NOW() 
       WHERE id = ${idParam}
       RETURNING id, application_stage, stage_changed_at`,
      baseVals
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Failed to update loan stage' });
    }
    
    console.log('🔍 DEBUG Timer Calculation:', {
      loanId,
      stage: stageData.stage,
      createdAt: 'from database',
      stageChangedAt: 'will be set to IST',
      istTime: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString()
    });
    
    console.log('Loan stage updated successfully:', {
      id: updateResult.rows[0].id,
      stage: updateResult.rows[0].application_stage,
      stage_changed_at: updateResult.rows[0].stage_changed_at
    });
    
    res.json({ 
      message: 'Loan stage updated successfully',
      loan: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update loan stage error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to update loan application stage'
    });
  }
};
