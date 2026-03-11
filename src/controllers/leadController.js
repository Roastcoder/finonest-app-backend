import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';
import { notifyLeadCreated } from '../utils/notificationTrigger.js';

export const getAllLeads = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, u.name as assigned_to_name, b.name as financier_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN banks b ON l.financier_id = b.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, u.name as assigned_to_name, b.name as financier_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN banks b ON l.financier_id = b.id
      WHERE l.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    // Generate customer_id: User initials (2) + Customer initials (1) + Sequential number (3)
    // Example: JAR001 (John Admin, Rahul, lead #1)
    
    // Get user's name initials (first 2 letters of first name)
    const userResult = await db.query('SELECT COALESCE(name, full_name, \'US\') as user_name FROM users WHERE id = $1', [req.user.id]);
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
      stage: 'lead',
      status: 'new',
      source: req.body.source,
      notes: req.body.notes,
      follow_up_date: req.body.follow_up_date
    };

    const { keys, values, params } = toPostgresParams(leadData);
    const result = await db.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id, customer_id`,
      values
    );

    await db.query(
      `INSERT INTO lead_stage_history (lead_id, to_stage, changed_by) VALUES ($1, $2, $3)`,
      [result.rows[0].id, 'lead', req.user.id]
    );

    if (leadData.assigned_to) {
      await notifyLeadCreated(result.rows[0].id, leadData.assigned_to);
    }

    res.status(201).json({ 
      message: 'Lead created successfully', 
      leadId: result.rows[0].id,
      customerId: result.rows[0].customer_id
    });
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM customer_profiles WHERE lead_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertCustomerProfile = async (req, res) => {
  try {
    const leadId = req.params.id;
    const existing = await db.query('SELECT id FROM customer_profiles WHERE lead_id = $1', [leadId]);

    if (existing.rows.length === 0) {
      const { keys, values, params } = toPostgresParams({ ...req.body, lead_id: leadId });
      const result = await db.query(
        `INSERT INTO customer_profiles (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
        values
      );
      return res.status(201).json({ message: 'Profile created successfully', profileId: result.rows[0].id });
    } else {
      const { query, values } = buildUpdateQuery('customer_profiles', req.body, existing.rows[0].id);
      await db.query(query, values);
      return res.json({ message: 'Profile updated successfully' });
    }
  } catch (error) {
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

    const leadData = {
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
      stage: 'lead',
      status: 'new',
      source: 'Reapplied from Lead ' + originalLeadId,
      notes: lead.notes,
    };

    const { keys, values, params } = toPostgresParams(leadData);
    const createResult = await db.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    const newLeadId = createResult.rows[0].id;

    await db.query(
      `INSERT INTO lead_stage_history (lead_id, to_stage, changed_by) VALUES ($1, $2, $3)`,
      [newLeadId, 'lead', req.user.id]
    );

    res.status(201).json({ message: 'Lead cloned successfully for reapplication', leadId: newLeadId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
