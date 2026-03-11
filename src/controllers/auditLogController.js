import db from '../config/database.js';

export const getAllAuditLogs = async (req, res) => {
  try {
    const { user, action, startDate, endDate } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (user) {
      query += ` AND user_id = $${paramCount++}`;
      params.push(user);
    }
    if (action) {
      query += ` AND action ILIKE $${paramCount++}`;
      params.push(`%${action}%`);
    }
    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT 1000';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
