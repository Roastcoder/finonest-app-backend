import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
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
    
    // Generate unique user ID
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM users 
       FOR UPDATE`
    );
    
    const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
    const initials = (name || 'XX').substring(0, 2).toUpperCase();
    const userId = `${initials}-${sequence}`;
    
    const result = await client.query(
      'INSERT INTO users (user_id, full_name, email, password, phone, role, reporting_to, branch, joining_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, user_id',
      [userId, name, email, hashedPassword, phone || null, role, reporting_to || null, branch || null, joining_date || new Date()]
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
    const result = await db.query('SELECT id, name, email, role, phone, status FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
