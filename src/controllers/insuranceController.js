import db from '../config/database.js';
import { toPostgresParams } from '../utils/postgres.js';

export const getAllPolicies = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ip.*, l.customer_name, l.loan_amount 
      FROM insurance_policies ip 
      JOIN loans l ON ip.loan_id = l.id 
      ORDER BY ip.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPolicy = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO insurance_policies (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Policy created', policyId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPolicyById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM insurance_policies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
