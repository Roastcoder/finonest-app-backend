import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query(`
      SELECT u.*, m.full_name as manager_name, m.role as manager_role
      FROM users u
      LEFT JOIN users m ON u.reporting_to = m.id
      WHERE u.email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.full_name, 
        email: user.email, 
        role: user.role,
        manager_name: user.manager_name,
        manager_role: user.manager_role,
        branch_id: user.branch_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { name, email, password, phone, role = 'executive', reporting_to, branch, joining_date } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate unique user ID with FN prefix
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM 'FN(\\d+)') AS INTEGER)), 0) + 1 as next_seq
       FROM users WHERE user_id LIKE 'FN%'`
    );
    
    const sequence = String(seqResult.rows[0].next_seq).padStart(5, '0');
    const userId = `FN${sequence}`;
    
    const result = await client.query(
      'INSERT INTO users (user_id, full_name, name, email, password, phone, role, reporting_to, branch, joining_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, user_id',
      [userId, name, name, email, hashedPassword, phone || null, role, reporting_to || null, branch || null, joining_date || new Date(), 'active']
    );

    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.rows[0].id,
      user_id: result.rows[0].user_id 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.full_name as name, u.email, u.role, u.phone, u.status, u.reporting_to, u.branch_id,
             b.name as branch_name,
             m.full_name as manager_name, m.role as manager_role
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN users m ON u.reporting_to = m.id
      WHERE u.id = $1
    `, [req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
