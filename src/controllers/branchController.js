import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllBranches = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, 
             COALESCE(u.full_name, u.user_id) as manager_name
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      ORDER BY b.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, 
             COALESCE(u.full_name, u.user_id) as manager_name
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      WHERE b.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get branch by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, code, address, city, state, manager_id } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Branch name and code are required' });
    }

    const branchData = {
      name,
      code,
      address: address || null,
      city: city || null,
      state: state || null,
      manager_id: manager_id || null,
      status: 'active'
    };

    const { keys, values, params } = toPostgresParams(branchData);
    const result = await db.query(
      `INSERT INTO branches (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );

    res.status(201).json({ 
      message: 'Branch created successfully', 
      branchId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Create branch error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Branch code already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { query, values } = buildUpdateQuery('branches', req.body, req.params.id);
    const result = await db.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({ message: 'Branch updated successfully' });
  } catch (error) {
    console.error('Update branch error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Branch code already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM branches WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: error.message });
  }
};