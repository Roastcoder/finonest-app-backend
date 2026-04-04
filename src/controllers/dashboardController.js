import db from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { timeline, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    let trackerDateFilter = '';
    let trackerParams = [];

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

    if (dateFilter) {
      trackerDateFilter = dateFilter;
      trackerParams = [...params];
    } else {
      trackerDateFilter = 'AND created_at >= $1';
      trackerParams = [monthStart];
    }

    const loginStats = await db.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", COUNT(l.id) as count
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED') ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

    const disbursementBankWise = await db.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", SUM(COALESCE(l.loan_amount, 0)) as amount, COUNT(l.id) as units
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage = 'DISBURSED' ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

    const approvedBankWise = await db.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", SUM(COALESCE(l.loan_amount, 0)) as amount, COUNT(l.id) as units
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage = 'APPROVED' ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

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

    const stageBreakdown = await db.query(`
      SELECT application_stage as stage, COUNT(*) as count 
      FROM loans l
      WHERE 1=1 ${dateFilter}
      GROUP BY 1
      ORDER BY 2 DESC
    `, params);

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

export const getConvertedLeads = async (req, res) => {
  try {
    const { timeline } = req.query;
    
    let dateFilter = '';
    let params = [];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    if (timeline === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      dateFilter = `AND l.created_at >= $1`;
      params.push(todayStart);
    } else if (timeline === 'this_month') {
      dateFilter = `AND l.created_at >= $1`;
      params.push(monthStart);
    }

    // Executive filter: sirf apni converted leads dikhaye
    let executiveFilter = '';
    if (req.user.role === 'executive') {
      const paramIndex = params.length + 1;
      executiveFilter = `AND (
        l.created_by = $${paramIndex}
        OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $${paramIndex} OR assigned_to = $${paramIndex})
      )`;
      params.push(req.user.id);
    }

    const query = `
      SELECT 
        l.id,
        l.loan_amount,
        l.application_stage,
        COALESCE(b.name, l.financier_name, 'Unassigned') as bank_name,
        l.created_at,
        COALESCE(l.customer_name, 'Customer ' || l.id) as customer_name
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage IN ('APPROVED', 'DISBURSED', 'IN_PROCESS', 'LOGIN', 'SUBMITTED')
      ${dateFilter}
      ${executiveFilter}
      ORDER BY l.created_at DESC
      LIMIT 100
    `;

    const result = await db.query(query, params);
    
    const convertedLeads = result.rows.map((row) => ({
      id: row.id,
      leadName: row.customer_name,
      loanId: `LN${String(row.id).padStart(5, '0')}`,
      loanAmount: parseInt(row.loan_amount || 0),
      status: row.application_stage,
      bankName: row.bank_name,
      createdAt: row.created_at
    }));

    res.json(convertedLeads);
  } catch (error) {
    console.error('Converted leads error:', error);
    res.status(500).json({ error: error.message });
  }
};
