import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllPayouts = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT p.*, u.name as dsa_name
      FROM payout_ledger p
      LEFT JOIN users u ON p.dsa_id = u.id
      ORDER BY p.created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPayoutById = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM payout_ledger WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPayout = async (req, res) => {
    try {
        const { keys, values, params } = toPostgresParams(req.body);
        const result = await db.query(
            `INSERT INTO payout_ledger (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
            values
        );
        res.status(201).json({ message: 'Created successfully', id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePayout = async (req, res) => {
    try {
        const { query, values } = buildUpdateQuery('payout_ledger', req.body, req.params.id);
        const result = await db.query(query, values);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePayout = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM payout_ledger WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
