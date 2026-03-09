import db from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const disbursedResult = await db.query(
      `SELECT COALESCE(SUM(loan_amount), 0) as total FROM loans WHERE status = 'disbursed'`
    );
    
    const payoutsResult = await db.query(
      `SELECT COALESCE(SUM(payout_amount), 0) as total FROM payout_ledger WHERE status = 'completed'`
    );
    
    const pendingResult = await db.query(
      `SELECT COALESCE(SUM(payout_amount), 0) as total FROM payout_ledger WHERE status = 'pending'`
    );
    
    const expensesResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'approved'`
    );
    
    const monthlyResult = await db.query(
      `SELECT DATE_TRUNC('month', disbursement_date) as month, SUM(loan_amount) as amount 
       FROM loans WHERE status = 'disbursed' GROUP BY DATE_TRUNC('month', disbursement_date) 
       ORDER BY month DESC LIMIT 12`
    );
    
    const paymentStatusResult = await db.query(
      `SELECT status, COUNT(*) as count FROM payout_ledger GROUP BY status`
    );
    
    const paymentStatus = {
      pending: 0,
      completed: 0,
      failed: 0
    };
    
    paymentStatusResult.rows.forEach(row => {
      paymentStatus[row.status] = parseInt(row.count);
    });
    
    res.json({
      totalDisbursed: disbursedResult.rows[0].total,
      totalPayouts: payoutsResult.rows[0].total,
      pendingPayments: pendingResult.rows[0].total,
      totalExpenses: expensesResult.rows[0].total,
      monthlyData: monthlyResult.rows.map(row => ({
        month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: row.amount
      })),
      paymentStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFolioAccounts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM rc_folio_accounts ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFolioAccount = async (req, res) => {
  try {
    const { opening_balance, current_balance } = req.body;
    const result = await db.query(
      `INSERT INTO rc_folio_accounts (opening_balance, current_balance, status) 
       VALUES ($1, $2, 'active') RETURNING *`,
      [opening_balance, current_balance]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFolioAccount = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM rc_folio_accounts WHERE id = $1`, [id]);
    res.json({ message: 'Folio account deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = `SELECT * FROM payout_ledger WHERE 1=1`;
    const params = [];
    
    if (status && status !== 'all') {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (startDate) {
      query += ` AND payment_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND payment_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY payment_date DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportPayments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, amount, status, payment_date, utr_reference FROM payout_ledger ORDER BY payment_date DESC`
    );
    
    const csv = 'ID,Amount,Status,Date,UTR\n' + 
      result.rows.map(row => 
        `${row.id},${row.amount},${row.status},${row.payment_date},${row.utr_reference || ''}`
      ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBankAccounts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM bank_statements ORDER BY upload_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBankAccount = async (req, res) => {
  try {
    const { account_number, bank_name, balance } = req.body;
    const result = await db.query(
      `INSERT INTO bank_statements (file_name, file_path, uploaded_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [`${bank_name}-${account_number}`, `bank-${account_number}`, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM bank_statements WHERE id = $1`, [id]);
    res.json({ message: 'Bank account deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
