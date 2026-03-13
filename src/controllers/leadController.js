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
    let query = `
      SELECT l.*, 
             l.phone as phone_no,
             l.vehicle_number as vehicle_no,
             l.city as district,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             l.stage_data,
             l.stage_history,
             COALESCE(l.converted_to_loan, false) as converted_to_loan
      FROM leads l
      WHERE 1=1
    `;
    
    const params = [];
    
    // Hide all converted leads from lead list (shown only in loan applications list)
    query += ` AND COALESCE(l.converted_to_loan, false) = false`;
    
    if (req.user.role === 'team_leader') {
      // Team leaders see leads assigned to them, created by them, and leads from their team members
      query += `
        AND (
          l.assigned_to = $1
          OR l.created_by = $1
          OR l.assigned_to IN (SELECT id FROM users WHERE reporting_to = $1)
          OR l.created_by IN (SELECT id FROM users WHERE reporting_to = $1)
        )
      `;
      params.push(req.user.id);
    } else if (req.user.role === 'manager') {
      // Managers see leads from their team leaders and all their team members
      query += `
        AND (l.assigned_to IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $1
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        ) OR l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $1
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        ))
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
          our_branch: lead.our_branch || 'Head Office'
        };
      } catch (err) {
        console.error('Error enriching lead data:', err);
        return lead;
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
             COALESCE(u.full_name, u.user_id) as assigned_to_name, 
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             b.name as financier_name,
             COALESCE(l.our_branch, br.name, 'Head Office') as our_branch,
             CASE WHEN ln.id IS NOT NULL THEN true ELSE false END as converted_to_loan,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             l.stage_data,
             l.stage_history
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
    } else if (req.user.role === 'manager') {
      // Managers can access leads from their team leaders and all their team members
      query += ` AND (
        l.assigned_to IN (
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
    
    console.log('Returning lead data for ID:', req.params.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lead by ID error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

export const createLead = async (req, res) => {
  try {
    // Generate customer_id: User initials (2) + Customer initials (1) + Sequential number (3)
    // Example: JAR001 (John Admin, Rahul, lead #1)
    
    // Get user's name initials (first 2 letters of first name)
    const userResult = await db.query('SELECT COALESCE(full_name, user_id, \'US\') as user_name FROM users WHERE id = $1', [req.user.id]);
    const userName = userResult.rows[0]?.user_name || 'User';
    const userInitials = userName.substring(0, 2).toUpperCase();
    
    // Get customer name initial (first letter of first name)
    const customerName = req.body.customer_name || 'Customer';
    const customerInitial = customerName.charAt(0).toUpperCase();
    
    // Get next sequential number for this user
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM leads WHERE created_by = $1',
      [req.user.id]
    );
    const leadNumber = (parseInt(countResult.rows[0].count) + 1).toString().padStart(3, '0');
    
    // Format: XXYZZZ (2 user initials + 1 customer initial + 3 digit number) = 6 characters
    const customerId = `${userInitials}${customerInitial}${leadNumber}`;

    const leadData = {
      customer_id: customerId,
      customer_name: req.body.customer_name,
      phone: req.body.phone,
      email: req.body.email,
      current_address: req.body.current_address,
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
      application_stage: 'SUBMITTED', // Auto-generated default status
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

    // Filter out null/undefined values
    const filteredData = Object.fromEntries(
      Object.entries(leadData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );

    const { keys, values, params } = toPostgresParams(filteredData);
    const result = await db.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id, customer_id`,
      values
    );

    await db.query(
      `INSERT INTO lead_stage_history (lead_id, to_stage, changed_by) VALUES ($1, $2, $3)`,
      [result.rows[0].id, 'lead', req.user.id]
    );

    if (filteredData.assigned_to) {
      await notifyLeadCreated(result.rows[0].id, filteredData.assigned_to);
    }

    res.status(201).json({ 
      message: 'Lead created successfully', 
      leadId: result.rows[0].id,
      customerId: result.rows[0].customer_id
    });
  } catch (error) {
    console.error('Lead creation error:', error);
    res.status(500).json({ error: error.message });
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
    const result = await db.query(
      'SELECT * FROM customer_portal_access WHERE lead_id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      // Return empty profile instead of 404
      return res.json({
        lead_id: req.params.id,
        customer_phone: null,
        access_token: null,
        last_login: null,
        created_at: null
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const upsertCustomerProfile = async (req, res) => {
  try {
    const leadId = req.params.id;
    const existing = await db.query('SELECT id FROM customer_portal_access WHERE lead_id = $1', [leadId]);

    if (existing.rows.length === 0) {
      const { keys, values, params } = toPostgresParams({ ...req.body, lead_id: leadId });
      const result = await db.query(
        `INSERT INTO customer_portal_access (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
        values
      );
      return res.status(201).json({ message: 'Profile created successfully', profileId: result.rows[0].id });
    } else {
      const { query, values } = buildUpdateQuery('customer_portal_access', req.body, existing.rows[0].id);
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
