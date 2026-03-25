import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllBrokers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM brokers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get brokers error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBrokerById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM brokers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get broker by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createBroker = async (req, res) => {
  try {
    const { name, company_name, email, phone, commission_rate } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Broker name is required' });
    }

    const brokerData = {
      name,
      company_name: company_name || null,
      email: email || null,
      phone: phone || null,
      commission_rate: commission_rate ? Number(commission_rate) : null,
      status: 'active'
    };

    const { keys, values, params } = toPostgresParams(brokerData);
    const result = await db.query(
      `INSERT INTO brokers (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ 
      message: 'Broker created successfully', 
      brokerId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Create broker error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Broker with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateBroker = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('brokers', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }
    res.json({ message: 'Broker updated successfully' });
  } catch (error) {
    console.error('Update broker error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Broker with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteBroker = async (req, res) => {
  try {
    // Check if broker has any active loans
    const dependencies = await db.query(
      'SELECT COUNT(*) as count FROM loans WHERE broker_id = $1 OR assigned_broker_id = $1',
      [req.params.id]
    );
    
    if (dependencies.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete broker with active loans. Please reassign loans first.' 
      });
    }

    const result = await db.query('DELETE FROM brokers WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }
    res.json({ message: 'Broker deleted successfully' });
  } catch (error) {
    console.error('Delete broker error:', error);
    res.status(500).json({ error: error.message });
  }
};
