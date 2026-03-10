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
    const { name, code, contact_person, contact_email, contact_phone } = req.body;
    const result = await db.query(
      'INSERT INTO banks (name, code, contact_person, contact_email, contact_phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, code, contact_person, contact_email, contact_phone]
    );
    res.status(201).json({ message: 'Bank created successfully', bankId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBank = async (req, res) => {
  try {
    const { name, code, contact_person, contact_email, contact_phone } = req.body;
    const result = await db.query(
      'UPDATE banks SET name = $1, code = $2, contact_person = $3, contact_email = $4, contact_phone = $5 WHERE id = $6',
      [name, code, contact_person, contact_email, contact_phone, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    res.json({ message: 'Bank updated successfully' });
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
