import db from '../config/database.js';

export const getAllAuditLogs = async (req, res) => {
  try {
    const { user, action, startDate, endDate } = req.query;
    let query = `
      SELECT al.*, COALESCE(u.full_name, u.user_id, al.user_id::text) as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (user) {
      query += ` AND al.user_id = $${paramCount++}`;
      params.push(user);
    }
    if (action) {
      query += ` AND al.action ILIKE $${paramCount++}`;
      params.push(`%${action}%`);
    }
    if (startDate) {
      query += ` AND al.created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND al.created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 1000';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
