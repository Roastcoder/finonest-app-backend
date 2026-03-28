import db from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { timeline, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    let trackerDateFilter = '';
    let trackerParams = [];

    // Helper for timeline logic
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    if (timeline === 'today') {
      dateFilter = 'AND l.created_at >= $1';
      params = [todayStart];
    } else if (timeline === 'yesterday') {
      dateFilter = 'AND l.created_at BETWEEN $1 AND $2';
      params = [yesterdayStart, yesterdayEnd];
    } else if (timeline === 'this_month') {
      dateFilter = 'AND l.created_at >= $1';
      params = [monthStart];
    } else if (startDate && endDate) {
      dateFilter = 'AND l.created_at BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }

    // For the Top KPI cards (Monthly Tracker baseline)
    if (dateFilter) {
      trackerDateFilter = dateFilter;
      trackerParams = [...params];
    } else {
      trackerDateFilter = 'AND created_at >= $1';
      trackerParams = [monthStart];
    }

    // 1. Bank wise login (from loans table)
    const loginStats = await db.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", COUNT(l.id) as count
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED') ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

    // 2. Bank wise Disbursements (from loans table)
    const disbursementBankWise = await db.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", SUM(COALESCE(l.loan_amount, 0)) as amount, COUNT(l.id) as units
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage = 'DISBURSED' ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

    // 2a. Financier wise Approved loans (NEW)
    const approvedBankWise = await db.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", SUM(COALESCE(l.loan_amount, 0)) as amount, COUNT(l.id) as units
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage = 'APPROVED' ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

    // 3. PDD Tracker (abandoned loans)
    const pddTrackerRows = await db.query(`
      SELECT 
        CASE 
          WHEN created_at >= NOW() - INTERVAL '30 days' THEN '0-30'
          WHEN created_at >= NOW() - INTERVAL '45 days' THEN '31-45'
          WHEN created_at >= NOW() - INTERVAL '60 days' THEN '46-60'
          WHEN created_at >= NOW() - INTERVAL '90 days' THEN '61-90'
          ELSE '90+'
        END as bucket,
        COUNT(*) as count
      FROM loans l
      WHERE l.application_stage = 'REJECTED' ${dateFilter} 
      GROUP BY 1
    `, params);

    const pddTracker = {};
    pddTrackerRows.rows.forEach(r => pddTracker[r.bucket] = parseInt(r.count || 0));

    // 4. Monthly Tracker (KPIs) - from loans table
    const monthlyTrackerQuery = await db.query(`
      SELECT 
        COUNT(CASE WHEN application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED') THEN 1 END) as login_units,
        COUNT(CASE WHEN application_stage = 'IN_PROCESS' THEN 1 END) as inprocess_units,
        COUNT(CASE WHEN application_stage = 'APPROVED' THEN 1 END) as approved_units,
        SUM(CASE WHEN application_stage = 'APPROVED' THEN COALESCE(loan_amount, 0) ELSE 0 END) as approved_amount,
        COUNT(CASE WHEN application_stage = 'DISBURSED' THEN 1 END) as disbursed_units,
        SUM(CASE WHEN application_stage = 'DISBURSED' THEN COALESCE(loan_amount, 0) ELSE 0 END) as disbursed_amount
      FROM loans l
      WHERE 1=1 ${trackerDateFilter}
    `, trackerParams);

    const m = monthlyTrackerQuery.rows[0] || {};

    // 5. Stage Breakdown (Funnel)
    const stageBreakdown = await db.query(`
      SELECT application_stage as stage, COUNT(*) as count 
      FROM loans l
      WHERE 1=1 ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

    // 6. In Process Tags
    const inProcessTags = await db.query(`
      SELECT 'Pending Follow-up' as tag, COUNT(id) as count 
      FROM loans l 
      WHERE l.application_stage = 'IN_PROCESS' ${dateFilter} 
      GROUP BY 1
    `, params);

    res.json({
      loginBankWise: loginStats.rows,
      disbursementBankWise: disbursementBankWise.rows,
      approvedBankWise: approvedBankWise.rows,
      pddTracker: pddTracker,
      stageBreakdown: stageBreakdown.rows,
      monthlyTracker: {
        login: parseInt(m.login_units || 0),
        inProcess: parseInt(m.inprocess_units || 0),
        approved: { units: parseInt(m.approved_units || 0), amount: parseFloat(m.approved_amount || 0) },
        disbursed: { units: parseInt(m.disbursed_units || 0), amount: parseFloat(m.disbursed_amount || 0) }
      },
      inProcessTags: inProcessTags.rows
    });
  } catch (error) {
    console.error('CRITICAL: Dashboard stats error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};
