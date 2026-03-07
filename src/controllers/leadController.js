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
    const leadData = {
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
      stage: 'lead',
      status: 'new',
      source: req.body.source,
      notes: req.body.notes,
      follow_up_date: req.body.follow_up_date
    };

    const { keys, values, params } = toPostgresParams(leadData);
    const result = await db.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );

    await db.query(
      `INSERT INTO lead_stage_history (lead_id, to_stage, changed_by) VALUES ($1, $2, $3)`,
      [result.rows[0].id, 'lead', req.user.id]
    );

    if (leadData.assigned_to) {
      await notifyLeadCreated(result.rows[0].id, leadData.assigned_to);
    }

    res.status(201).json({ message: 'Lead created successfully', leadId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
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
