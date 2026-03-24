import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllBranches = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM branches ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM branches WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get branch by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getNextBranchCode = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'FIPL(\\d+)') AS INTEGER)), 0) + 1 as next_seq
       FROM branches WHERE code ~ '^FIPL\\d+$'`
    );
    const seq = String(result.rows[0].next_seq).padStart(3, '0');
    res.json({ code: `FIPL${seq}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, address, city, state, pincode, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Branch name is required' });
    }
    // Auto-generate code
    const seqResult = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'FIPL(\\d+)') AS INTEGER)), 0) + 1 as next_seq
       FROM branches WHERE code ~ '^FIPL\\d+$'`
    );
    const seq = String(seqResult.rows[0].next_seq).padStart(3, '0');
    const code = `FIPL${seq}`;
    const result = await db.query(
      `INSERT INTO branches (name, code, address, city, state, pincode, is_active, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, code`,
      [name, code, address || null, city || null, state || null, pincode || null,
       is_active !== false, is_active !== false ? 'active' : 'inactive']
    );
    res.status(201).json({ message: 'Branch created successfully', branchId: result.rows[0].id, code: result.rows[0].code });
  } catch (error) {
    console.error('Create branch error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Branch code already exists' });
    res.status(500).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { name, code, address, city, state, pincode, is_active } = req.body;
    const result = await db.query(
      `UPDATE branches SET name=$1, code=$2, address=$3, city=$4, state=$5, pincode=$6,
       is_active=$7, status=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9 RETURNING id`,
      [name, code, address || null, city || null, state || null, pincode || null,
       is_active !== false, is_active !== false ? 'active' : 'inactive', req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json({ message: 'Branch updated successfully' });
  } catch (error) {
    console.error('Update branch error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Branch code already exists' });
    res.status(500).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM branches WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: error.message });
  }
};