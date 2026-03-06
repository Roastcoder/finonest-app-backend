// This file contains all controller updates for PostgreSQL
// Copy these to respective controller files

// bankController.js
import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllBanks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM banks ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBankById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM banks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBank = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO banks (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Bank created successfully', bankId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBank = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('banks', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json({ message: 'Bank updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM banks WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
