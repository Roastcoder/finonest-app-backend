import db from '../config/database.js';
import { toPostgresParams, buildUpdateQuery } from '../utils/postgres.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/expenses');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and PDF files are allowed'));
    }
  }
});

export const getAllExpenses = async (req, res) => {
  try {
    let query = `
      SELECT e.*, 
        u.name as employee_name, 
        u.role as employee_role,
        a.name as approved_by_name
      FROM expenses e
      JOIN users u ON e.employee_id = u.id
      LEFT JOIN users a ON e.approved_by = a.id
    `;
    
    const conditions = [];
    const params = [];
    
    // Filter based on user role
    if (req.user.role === 'manager' || req.user.role === 'sales_manager') {
      // Managers see: their own expenses OR expenses they created OR expenses from their team members
      conditions.push(`(e.employee_id = $${params.length + 1} OR e.created_by = $${params.length + 1} OR u.reporting_to = $${params.length + 1})`);
      params.push(req.user.id);
    } else if (req.user.role === 'dsa' || req.user.role === 'executive') {
      // DSA/Executives see only their own expenses
      conditions.push(`e.employee_id = $${params.length + 1}`);
      params.push(req.user.id);
    }
    // Admin sees all expenses (no filter)
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const data = {
      expense_type: req.body.expense_type,
      employee_id: req.body.employee_id,
      description: req.body.description,
      amount: req.body.amount,
      expense_date: req.body.expense_date,
      document_path: req.file ? req.file.path : null,
      status: 'pending',
      created_by: req.user.id
    };
    
    const { keys, values, params } = toPostgresParams(data);
    const result = await db.query(
      `INSERT INTO expenses (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'Expense submitted successfully', expenseId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveExpense = async (req, res) => {
  try {
    // Check if user has permission to approve this expense
    const expenseCheck = await db.query(
      `SELECT e.*, u.reporting_to 
       FROM expenses e 
       JOIN users u ON e.employee_id = u.id 
       WHERE e.id = $1`,
      [req.params.id]
    );
    
    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    const expense = expenseCheck.rows[0];
    
    // Only admin or the reporting manager can approve
    if (req.user.role !== 'admin' && expense.reporting_to !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to approve this expense' });
    }
    
    await db.query(
      'UPDATE expenses SET status = $1, approved_by = $2, approval_date = NOW() WHERE id = $3',
      ['approved', req.user.id, req.params.id]
    );
    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectExpense = async (req, res) => {
  try {
    // Check if user has permission to reject this expense
    const expenseCheck = await db.query(
      `SELECT e.*, u.reporting_to 
       FROM expenses e 
       JOIN users u ON e.employee_id = u.id 
       WHERE e.id = $1`,
      [req.params.id]
    );
    
    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    const expense = expenseCheck.rows[0];
    
    // Only admin or the reporting manager can reject
    if (req.user.role !== 'admin' && expense.reporting_to !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to reject this expense' });
    }
    
    await db.query(
      'UPDATE expenses SET status = $1, approved_by = $2, approval_date = NOW(), remarks = $3 WHERE id = $4',
      ['rejected', req.user.id, req.body.remarks, req.params.id]
    );
    res.json({ message: 'Expense rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpenseStats = async (req, res) => {
  try {
    let whereClause = '';
    const params = [];
    
    if (req.user.role === 'manager' || req.user.role === 'sales_manager') {
      whereClause = 'WHERE (e.employee_id = $1 OR e.created_by = $1 OR u.reporting_to = $1)';
      params.push(req.user.id);
    } else if (req.user.role === 'dsa' || req.user.role === 'executive') {
      whereClause = 'WHERE e.employee_id = $1';
      params.push(req.user.id);
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE e.status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE e.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE e.status = 'rejected') as rejected_count,
        COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'approved'), 0) as total_approved_amount,
        COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'pending'), 0) as total_pending_amount
      FROM expenses e
      JOIN users u ON e.employee_id = u.id
      ${whereClause}
    `, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
