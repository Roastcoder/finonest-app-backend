import db from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/bank-logos';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bank-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const getAllBanks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM banks ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBankById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM banks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBank = async (req, res) => {
  try {
    const { 
      name, location, geo_limit, sales_manager_name, sales_manager_mobile,
      area_sales_manager_name, area_sales_manager_mobile, product
    } = req.body;
    
    const logo_url = req.file ? `/uploads/bank-logos/${req.file.filename}` : null;
    
    const result = await db.query(
      `INSERT INTO banks (
        name, location, geo_limit, sales_manager_name, sales_manager_mobile,
        area_sales_manager_name, area_sales_manager_mobile, product, logo_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active') RETURNING id`,
      [name, location, geo_limit, sales_manager_name, sales_manager_mobile,
       area_sales_manager_name, area_sales_manager_mobile, product, logo_url]
    );
    res.status(201).json({ message: 'Bank created successfully', bankId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBank = async (req, res) => {
  try {
    const { 
      name, location, geo_limit, sales_manager_name, sales_manager_mobile,
      area_sales_manager_name, area_sales_manager_mobile, product, status
    } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (geo_limit !== undefined) {
      updates.push(`geo_limit = $${paramCount++}`);
      values.push(geo_limit);
    }
    if (sales_manager_name !== undefined) {
      updates.push(`sales_manager_name = $${paramCount++}`);
      values.push(sales_manager_name);
    }
    if (sales_manager_mobile !== undefined) {
      updates.push(`sales_manager_mobile = $${paramCount++}`);
      values.push(sales_manager_mobile);
    }
    if (area_sales_manager_name !== undefined) {
      updates.push(`area_sales_manager_name = $${paramCount++}`);
      values.push(area_sales_manager_name);
    }
    if (area_sales_manager_mobile !== undefined) {
      updates.push(`area_sales_manager_mobile = $${paramCount++}`);
      values.push(area_sales_manager_mobile);
    }
    if (product !== undefined) {
      updates.push(`product = $${paramCount++}`);
      values.push(product);
    }
    if (req.file) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(`/uploads/bank-logos/${req.file.filename}`);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    const result = await db.query(
      `UPDATE banks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json({ message: 'Bank updated successfully', bank: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM banks WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBankBranches = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM bank_branches WHERE bank_id = $1 ORDER BY branch_name',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('getBankBranches error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { branch_name, location, geo_limit, product, sales_manager_name, sales_manager_mobile, area_sales_manager_name, area_sales_manager_mobile } = req.body;
    if (!branch_name) return res.status(400).json({ error: 'branch_name is required' });
    const result = await db.query(
      `INSERT INTO bank_branches (bank_id, branch_name, location, geo_limit, product, sales_manager_name, sales_manager_mobile, area_sales_manager_name, area_sales_manager_mobile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.params.id, branch_name, location || null, geo_limit || null, product || null, sales_manager_name || null, sales_manager_mobile || null, area_sales_manager_name || null, area_sales_manager_mobile || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createBranch error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { branch_name, location, geo_limit, product, sales_manager_name, sales_manager_mobile, area_sales_manager_name, area_sales_manager_mobile, status } = req.body;
    if (!branch_name) return res.status(400).json({ error: 'branch_name is required' });
    const result = await db.query(
      `UPDATE bank_branches SET branch_name=$1, location=$2, geo_limit=$3, product=$4, sales_manager_name=$5, sales_manager_mobile=$6, area_sales_manager_name=$7, area_sales_manager_mobile=$8, status=$9, updated_at=CURRENT_TIMESTAMP
       WHERE id=$10 AND bank_id=$11 RETURNING *`,
      [branch_name, location || null, geo_limit || null, product || null, sales_manager_name || null, sales_manager_mobile || null, area_sales_manager_name || null, area_sales_manager_mobile || null, status || 'active', req.params.branchId, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('updateBranch error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM bank_branches WHERE id=$1 AND bank_id=$2', [req.params.branchId, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
