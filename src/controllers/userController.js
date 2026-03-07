import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, branch, reporting_to, joining_date, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, branch, reporting_to, joining_date, created_at FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { password, role, full_name, email, phone, branch_id } = req.body;
    
    // Managers can only create team_leader and executive roles
    if (req.user.role === 'manager' && !['team_leader', 'executive'].includes(role)) {
      return res.status(403).json({ error: 'Managers can only create team leaders and executives' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate unique user ID
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM users 
       FOR UPDATE`
    );
    
    const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
    const initials = (full_name || 'XX').substring(0, 2).toUpperCase();
    const userId = `${initials}-${sequence}`;
    
    const result = await client.query(
      `INSERT INTO users (user_id, full_name, email, password, phone, role, branch_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, user_id`,
      [userId, full_name, email, hashedPassword, phone || null, role, branch_id || null]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.rows[0].id,
      user_id: result.rows[0].user_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }
    const { query, values } = buildUpdateQuery('users', userData, req.params.id);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
