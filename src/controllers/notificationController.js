import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllNotifications = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT n.*, u.name as user_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getNotificationById = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notifications WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createNotification = async (req, res) => {
    try {
        const { keys, values, params } = toPostgresParams(req.body);
        const result = await db.query(
            `INSERT INTO notifications (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
            values
        );
        res.status(201).json({ message: 'Created successfully', id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateNotification = async (req, res) => {
    try {
        const { query, values } = buildUpdateQuery('notifications', req.body, req.params.id);
        const result = await db.query(query, values);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
