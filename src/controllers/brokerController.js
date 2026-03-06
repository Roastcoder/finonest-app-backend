import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllBrokers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM brokers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};

export const createBroker = async (req, res) => {
  try {
    const { keys, values, params } = toPostgresParams(req.body);
    const result = await db.query(
      `INSERT INTO brokers (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Broker created successfully', brokerId: result.rows[0].id });
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};

export const deleteBroker = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM brokers WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }
    res.json({ message: 'Broker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
