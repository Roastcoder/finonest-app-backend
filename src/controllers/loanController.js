import db from '../config/database.js';
import { buildUpdateQuery } from '../utils/postgres.js';

export const getAllLoans = async (req, res) => {
  try {
    const { status, bank_id, assigned_to } = req.query;
    let query = `
      SELECT l.*, 
        b.name as bank_name, 
        br.name as broker_name, 
        u.name as assigned_user_name
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      LEFT JOIN brokers br ON l.broker_id = br.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(status);
    }
    if (bank_id) {
      query += ` AND l.bank_id = $${paramCount++}`;
      params.push(bank_id);
    }
    if (assigned_to) {
      query += ` AND l.assigned_to = $${paramCount++}`;
      params.push(assigned_to);
    }

    query += ' ORDER BY l.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, 
        b.name as bank_name, 
        br.name as broker_name, 
        u.name as assigned_user_name
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      LEFT JOIN brokers br ON l.broker_id = br.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLoan = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Get user details
    const userResult = await client.query(
      'SELECT id, full_name FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    const initials = (user.full_name || 'XX').substring(0, 2).toUpperCase();
    const userId = String(user.id).padStart(4, '0');
    
    // Get next sequence for this user with row lock
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM loans 
       WHERE created_by = $1 
       FOR UPDATE`,
      [req.user.id]
    );
    
    const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
    const loanId = `${initials}-${userId}-${sequence}`;
    
    // Insert loan with generated loan_number
    const loanData = { ...req.body, loan_number: loanId };
    const keys = Object.keys(loanData);
    const values = Object.values(loanData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await client.query(
      `INSERT INTO loans (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id, loan_number`,
      values
    );
    
    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Loan created successfully', 
      id: result.rows[0].id,
      loan_number: result.rows[0].loan_number 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateLoan = async (req, res) => {
  try {
    const { status, disbursement_date } = req.body;
    const { query, values } = buildUpdateQuery('loans', req.body, req.params.id);
    const result = await db.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (status === 'disbursed') {
      const loan = await db.query('SELECT * FROM loans WHERE id = $1', [req.params.id]);
      const lead = await db.query('SELECT * FROM leads WHERE customer_phone = $1', [loan.rows[0].customer_phone]);
      
      if (lead.rows.length > 0) {
        const dsaResult = await db.query(
          'SELECT id FROM users WHERE role = $1 AND id = (SELECT reporting_to FROM users WHERE id = $2)',
          ['dsa', lead.rows[0].assigned_to]
        );

        if (dsaResult.rows.length > 0) {
          await db.query(
            `INSERT INTO rc_folio_accounts (loan_id, dsa_id, opening_balance, current_balance)
             VALUES ($1, $2, $3, $3)`,
            [req.params.id, dsaResult.rows[0].id, loan.rows[0].loan_amount]
          );

          const payoutConfig = await db.query(
            'SELECT * FROM payout_config WHERE dsa_id = $1 AND bank_id = $2 AND payout_enabled = true',
            [dsaResult.rows[0].id, loan.rows[0].bank_id]
          );

          if (payoutConfig.rows.length > 0) {
            const payoutAmount = (loan.rows[0].loan_amount * payoutConfig.rows[0].payout_percentage) / 100;
            await db.query(
              `INSERT INTO payout_ledger (loan_id, dsa_id, disbursed_amount, payout_percentage, payout_amount)
               VALUES ($1, $2, $3, $4, $5)`,
              [req.params.id, dsaResult.rows[0].id, loan.rows[0].loan_amount, payoutConfig.rows[0].payout_percentage, payoutAmount]
            );
          }
        }
      }
    }

    res.json({ message: 'Loan updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
