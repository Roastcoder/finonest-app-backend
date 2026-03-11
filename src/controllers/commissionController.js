import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllCommissions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, l.loan_number, l.customer_name, b.name as broker_name, u.name as user_name
      FROM commissions c
      LEFT JOIN loans l ON c.loan_id = l.id
      LEFT JOIN brokers b ON c.broker_id = b.id
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCommissionById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, l.loan_number, l.customer_name, b.name as broker_name, u.name as user_name
      FROM commissions c
      LEFT JOIN loans l ON c.loan_id = l.id
      LEFT JOIN brokers b ON c.broker_id = b.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCommission = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO commissions (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Commission created successfully', commissionId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCommission = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('commissions', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    res.json({ message: 'Commission updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCommission = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM commissions WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    res.json({ message: 'Commission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
