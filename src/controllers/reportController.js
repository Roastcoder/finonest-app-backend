import db from '../config/database.js';

const getDateRange = (filter) => {
  const now = new Date();
  let startDate, endDate = now;
  
  switch(filter) {
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'this_fy':
      startDate = new Date(now.getFullYear(), 3, 1);
      break;
    case 'last_fy':
      startDate = new Date(now.getFullYear() - 1, 3, 1);
      endDate = new Date(now.getFullYear(), 2, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { startDate, endDate };
};

export const getAnalyticsReport = async (req, res) => {
  try {
    const { filter = 'mtd', drillDown = 'bank' } = req.query;
    const { startDate, endDate } = getDateRange(filter);

    const login = await db.query(
      `SELECT COUNT(*) as count FROM leads WHERE stage IN ('login', 'approved', 'abnd', 'disbursed') AND created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const approval = await db.query(
      `SELECT COUNT(*) as count FROM leads WHERE stage IN ('approved', 'abnd', 'disbursed') AND created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const disbursal = await db.query(
      `SELECT COUNT(*) as count FROM leads WHERE stage = 'disbursed' AND created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    let drillDownData = [];
    if (drillDown === 'bank') {
      const result = await db.query(
        `SELECT b.name, COUNT(l.id) as count FROM leads l JOIN banks b ON l.financier_id = b.id WHERE l.created_at BETWEEN $1 AND $2 GROUP BY b.name`,
        [startDate, endDate]
      );
      drillDownData = result.rows;
    } else if (drillDown === 'manager') {
      const result = await db.query(
        `SELECT u.name, COUNT(l.id) as count FROM leads l JOIN users u ON l.assigned_to = u.id WHERE u.role = 'sales_manager' AND l.created_at BETWEEN $1 AND $2 GROUP BY u.name`,
        [startDate, endDate]
      );
      drillDownData = result.rows;
    } else if (drillDown === 'executive') {
      const result = await db.query(
        `SELECT u.name, COUNT(l.id) as count FROM leads l JOIN users u ON l.assigned_to = u.id WHERE u.role = 'executive' AND l.created_at BETWEEN $1 AND $2 GROUP BY u.name`,
        [startDate, endDate]
      );
      drillDownData = result.rows;
    }

    res.json({
      login: parseInt(login.rows[0].count),
      approval: parseInt(approval.rows[0].count),
      disbursal: parseInt(disbursal.rows[0].count),
      drillDownData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLoanReport = async (req, res) => {
  try {
    const { start_date, end_date, bank_id, status } = req.query;
    let query = 'SELECT l.*, b.name as bank_name, u.name as user_name FROM loans l LEFT JOIN banks b ON l.bank_id = b.id LEFT JOIN users u ON l.user_id = u.id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND l.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND l.created_at <= $${paramCount++}`;
      params.push(end_date);
    }
    if (bank_id) {
      query += ` AND l.bank_id = $${paramCount++}`;
      params.push(bank_id);
    }
    if (status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(status);
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCommissionReport = async (req, res) => {
  try {
    const { start_date, end_date, broker_id, status } = req.query;
    let query = 'SELECT c.*, l.loan_number, b.name as broker_name FROM commissions c LEFT JOIN loans l ON c.loan_id = l.id LEFT JOIN brokers b ON c.broker_id = b.id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND c.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND c.created_at <= $${paramCount++}`;
      params.push(end_date);
    }
    if (broker_id) {
      query += ` AND c.broker_id = $${paramCount++}`;
      params.push(broker_id);
    }
    if (status) {
      query += ` AND c.status = $${paramCount++}`;
      params.push(status);
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.name, u.role, COUNT(l.id) as total_loans, SUM(l.loan_amount) as total_amount
      FROM users u
      LEFT JOIN loans l ON u.id = l.user_id
      GROUP BY u.id, u.name, u.role
      ORDER BY total_amount DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
