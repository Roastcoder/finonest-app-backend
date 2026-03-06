import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, phone, status, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = { ...userData, password: hashedPassword };
    const { keys, values, params } = toPostgresParams(data);
    
    const result = await db.query(
      `INSERT INTO users (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    res.status(201).json({ message: 'User created successfully', userId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
