import db from '../config/database.js';
import { toPostgresParams, buildUpdateQuery } from '../utils/postgres.js';

export const getAllExpenses = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.name as employee_name, a.name as approved_by_name
      FROM expenses e
      JOIN users u ON e.employee_id = u.id
      LEFT JOIN users a ON e.approved_by = a.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const data = { ...req.body, employee_id: req.user.id };
    const { keys, values, params } = toPostgresParams(data);
    const result = await db.query(
      `INSERT INTO expenses (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Expense submitted', expenseId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveExpense = async (req, res) => {
  try {
    await db.query(
      'UPDATE expenses SET status = $1, approved_by = $2, approval_date = NOW() WHERE id = $3',
      ['approved', req.user.id, req.params.id]
    );
    res.json({ message: 'Expense approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectExpense = async (req, res) => {
  try {
    await db.query(
      'UPDATE expenses SET status = $1, approved_by = $2, approval_date = NOW(), remarks = $3 WHERE id = $4',
      ['rejected', req.user.id, req.body.remarks, req.params.id]
    );
    res.json({ message: 'Expense rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
