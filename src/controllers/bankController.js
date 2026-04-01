import db from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

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
    const banksResult = await db.query('SELECT * FROM banks ORDER BY name');
    const banks = banksResult.rows;
    
    // Get branches for each bank
    const banksWithBranches = [];
    for (const bank of banks) {
      try {
        const branchesResult = await db.query(
          'SELECT * FROM bank_branches WHERE bank_id = $1 AND status = $2 ORDER BY branch_name',
          [bank.id, 'active']
        );
        banksWithBranches.push({
          ...bank,
          branches: branchesResult.rows || []
        });
      } catch (branchError) {
        console.error(`Error fetching branches for bank ${bank.id}:`, branchError.message);
        banksWithBranches.push({
          ...bank,
          branches: []
        });
      }
    }
    
    res.json(banksWithBranches);
  } catch (error) {
    console.error('getAllBanks error:', error);
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

export const importBanksWithBranches = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      for (const row of data) {
        try {
          const bankName = row['Bank Name']?.trim();
          const branchName = row['Branch Name']?.trim();
          const location = row['Location']?.trim() || null;
          const geoLimit = row['Geo Limit'] ? parseInt(row['Geo Limit']) : null;
          const product = row['Product']?.trim() || null;
          const salesManagerName = row['Sales Manager Name']?.trim() || null;
          const salesManagerMobile = row['Sales Manager Mobile']?.trim() || null;
          const areaManagerName = row['Area Manager Name']?.trim() || null;
          const areaManagerMobile = row['Area Manager Mobile']?.trim() || null;

          if (!bankName || !branchName) {
            results.failed++;
            results.errors.push(`Row skipped: Bank Name and Branch Name are required`);
            continue;
          }

          let bankResult = await client.query('SELECT id FROM banks WHERE name = $1', [bankName]);
          let bankId;

          if (bankResult.rows.length === 0) {
            const newBankResult = await client.query(
              `INSERT INTO banks (name, status) VALUES ($1, 'active') RETURNING id`,
              [bankName]
            );
            bankId = newBankResult.rows[0].id;
          } else {
            bankId = bankResult.rows[0].id;
          }

          await client.query(
            `INSERT INTO bank_branches (bank_id, branch_name, location, geo_limit, product, sales_manager_name, sales_manager_mobile, area_sales_manager_name, area_sales_manager_mobile, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')`,
            [bankId, branchName, location, geoLimit, product, salesManagerName, salesManagerMobile, areaManagerName, areaManagerMobile]
          );

          results.success++;
        } catch (rowError) {
          results.failed++;
          results.errors.push(`Row error: ${rowError.message}`);
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Import completed', ...results });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      fs.unlinkSync(req.file.path);
    }
  } catch (error) {
    console.error('importBanksWithBranches error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};
