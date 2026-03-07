import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getFinancierLocations = async (req, res) => {
  try {
    const { bankId } = req.params;
    const result = await db.query(
      `SELECT fl.*, b.name as bank_name 
       FROM financier_locations fl 
       JOIN banks b ON fl.bank_id = b.id 
       WHERE fl.bank_id = $1 
       ORDER BY fl.state, fl.city`,
      [bankId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFinancierLocation = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO financier_locations (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Location added successfully', locationId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFinancierLocation = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('financier_locations', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFinancierLocation = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM financier_locations WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFinancierRates = async (req, res) => {
  try {
    const { bankId } = req.params;
    const result = await db.query(
      `SELECT fr.*, b.name as bank_name 
       FROM financier_rates fr 
       JOIN banks b ON fr.bank_id = b.id 
       WHERE fr.bank_id = $1`,
      [bankId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFinancierRate = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO financier_rates (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Rate added successfully', rateId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFinancierRate = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('financier_rates', req.body, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Rate not found' });
    }
    res.json({ message: 'Rate updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
