import db from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = startDate && endDate ? 'AND created_at BETWEEN $1 AND $2' : '';
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Bank wise login
    const loginStats = await db.query(`
      SELECT b.name as "bankName", COUNT(l.id) as count
      FROM leads l
      JOIN banks b ON l.financier_id = b.id
      WHERE l.stage IN ('login', 'approved', 'abnd', 'disbursed') ${dateFilter}
      GROUP BY b.id, b.name
      ORDER BY count DESC
    `, params);

    // Bank wise ABND
    const abndBankWise = await db.query(`
      SELECT b.name as "bankName", SUM(l.loan_amount_required) as amount
      FROM leads l
      JOIN banks b ON l.financier_id = b.id
      WHERE l.stage = 'abnd' ${dateFilter}
      GROUP BY b.id, b.name 
      ORDER BY amount DESC
    `, params);

    // Bank wise Disbursements
    const disbursementBankWise = await db.query(`
      SELECT b.name as "bankName", SUM(l.loan_amount_required) as amount
      FROM leads l
      JOIN banks b ON l.financier_id = b.id
      WHERE l.stage = 'disbursed' ${dateFilter}
      GROUP BY b.id, b.name 
      ORDER BY amount DESC
    `, params);

    // Enhanced PDD Tracker mapping
    const pddTrackerRows = await db.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 0 AND 30 THEN '0-30'
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 31 AND 45 THEN '31-45'
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 46 AND 60 THEN '46-60'
          WHEN EXTRACT(DAY FROM NOW() - created_at) BETWEEN 61 AND 90 THEN '61-90'
          ELSE '90+'
        END as bucket,
        COUNT(*) as count
      FROM leads WHERE stage = 'abnd' GROUP BY bucket
    `);

    // Shape PDD output object identically to frontend mappings
    const pddTracker = {};
    pddTrackerRows.rows.forEach(r => pddTracker[r.bucket] = r.count);

    // Monthly App Tracker metrics (Using 'this month' as baseline)
    const monthlyTrackerQuery = await db.query(`
      SELECT 
        SUM(CASE WHEN stage IN ('login', 'approved', 'abnd', 'disbursed') THEN 1 ELSE 0 END) as login_units,
        SUM(CASE WHEN stage IN ('login', 'in_process') THEN 1 ELSE 0 END) as inprocess_units,
        SUM(CASE WHEN stage IN ('approved', 'abnd', 'disbursed') THEN 1 ELSE 0 END) as approved_units,
        SUM(CASE WHEN stage IN ('approved', 'abnd', 'disbursed') THEN COALESCE(loan_amount_required, 0) ELSE 0 END) as approved_amount,
        SUM(CASE WHEN stage = 'disbursed' THEN 1 ELSE 0 END) as disbursed_units,
        SUM(CASE WHEN stage = 'disbursed' THEN COALESCE(loan_amount_required, 0) ELSE 0 END) as disbursed_amount
      FROM leads
      WHERE created_at >= $1
    `, [monthStart]);

    const m = monthlyTrackerQuery.rows[0];

    // In Process Tags lookup (Requires tags table integration, fallback logic for demonstration given schema constraint)
    const inProcessTags = await db.query(`
      SELECT 'Pending Follow-up' as tag, COUNT(id) as count FROM leads WHERE stage IN ('login', 'lead') GROUP BY 1
    `);

    res.json({
      loginBankWise: loginStats.rows,
      abndBankWise: abndBankWise.rows,
      disbursementBankWise: disbursementBankWise.rows,
      pddTracker: pddTracker,
      monthlyTracker: {
        login: parseInt(m.login_units || 0),
        inProcess: parseInt(m.inprocess_units || 0),
        approved: { units: parseInt(m.approved_units || 0), amount: parseFloat(m.approved_amount || 0) },
        disbursed: { units: parseInt(m.disbursed_units || 0), amount: parseFloat(m.disbursed_amount || 0) }
      },
      inProcessTags: inProcessTags.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
