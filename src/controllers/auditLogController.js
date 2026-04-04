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

export const deleteAuditLogsByDateRange = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate) {
      return res.status(400).json({ error: 'fromDate is required' });
    }

    // Default toDate to today if not provided
    const endDate = toDate || new Date().toISOString().split('T')[0];

    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(endDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (from > to) {
      return res.status(400).json({ error: 'fromDate cannot be after toDate' });
    }

    // Delete logs within the date range
    const query = `
      DELETE FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2
      RETURNING id
    `;

    const result = await db.query(query, [fromDate, endDate + ' 23:59:59']);

    console.log(`Deleted ${result.rowCount} audit logs from ${fromDate} to ${endDate}`);

    res.json({
      success: true,
      deletedCount: result.rowCount,
      fromDate,
      toDate: endDate
    });
  } catch (error) {
    console.error('Delete audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
};
