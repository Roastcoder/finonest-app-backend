import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllBranches = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM branches WHERE status = $1 ORDER BY name', ['active']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM branches WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO branches (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Branch created successfully', branchId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('branches', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM branches WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
