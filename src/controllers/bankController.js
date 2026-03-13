import db from '../config/database.js';

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
      name, geo_limit, sales_manager_name, sales_manager_mobile,
      area_sales_manager_name, area_sales_manager_mobile, product, logo_url,
      location, interest_rate, is_active
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO banks (
        name, location, geo_limit, sales_manager_name, sales_manager_mobile,
        area_sales_manager_name, area_sales_manager_mobile, product, logo_url,
        interest_rate, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [name, location, geo_limit, sales_manager_name, sales_manager_mobile,
       area_sales_manager_name, area_sales_manager_mobile, product, logo_url,
       interest_rate, is_active]
    );
    res.status(201).json({ message: 'Bank created successfully', bankId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBank = async (req, res) => {
  try {
    const { name, code, contact_person, contact_email, contact_phone, status, location, geo_limit, sales_manager_name, sales_manager_mobile, area_sales_manager_name, area_sales_manager_mobile, product, logo_url, interest_rate, is_active } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(code);
    }
    if (contact_person !== undefined) {
      updates.push(`contact_person = $${paramCount++}`);
      values.push(contact_person);
    }
    if (contact_email !== undefined) {
      updates.push(`contact_email = $${paramCount++}`);
      values.push(contact_email);
    }
    if (contact_phone !== undefined) {
      updates.push(`contact_phone = $${paramCount++}`);
      values.push(contact_phone);
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
