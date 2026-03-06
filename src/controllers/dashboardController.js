import db from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = startDate && endDate ? 'AND created_at BETWEEN $1 AND $2' : '';
    const params = startDate && endDate ? [startDate, endDate] : [];

    const loginStats = await db.query(`
      SELECT b.name as bank_name, COUNT(l.id) as login_count
      FROM leads l
      JOIN banks b ON l.financier_id = b.id
      WHERE l.stage IN ('login', 'approved', 'abnd', 'disbursed') ${dateFilter}
      GROUP BY b.id, b.name
      ORDER BY login_count DESC
    `, params);

    const abndCount = await db.query(`SELECT COUNT(*) as count FROM leads WHERE stage = 'abnd' ${dateFilter}`, params);
    const disbursementCount = await db.query(`SELECT COUNT(*) as count FROM leads WHERE stage = 'disbursed' ${dateFilter}`, params);

    const pddTracker = await db.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 0 AND 30 THEN '0-30 days'
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 31 AND 45 THEN '31-45 days'
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 46 AND 60 THEN '46-60 days'
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 61 AND 90 THEN '61-90 days'
          ELSE '90+ days'
        END as bucket,
        COUNT(*) as count
      FROM leads WHERE stage = 'abnd' GROUP BY bucket ORDER BY bucket
    `);

    res.json({
      loginStats: loginStats.rows,
      abnd: abndCount.rows[0].count,
      disbursement: disbursementCount.rows[0].count,
      pddTracker: pddTracker.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
