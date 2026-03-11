import db from '../config/database.js';

export const getDSAFolios = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM rc_folio_accounts WHERE dsa_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllEntries = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM rc_ledger_entries ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const importBankStatement = async (req, res) => {
  try {
    res.json({ message: 'Statement import feature coming soon' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllFolios = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT rf.*, u.name as dsa_name 
      FROM rc_folio_accounts rf 
      JOIN users u ON rf.dsa_id = u.id 
      ORDER BY rf.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveEntry = async (req, res) => {
  try {
    await db.query(
      'UPDATE rc_ledger_entries SET status = $1, approved_by = $2, approval_date = NOW() WHERE id = $3',
      ['approved', req.user.id, req.params.id]
    );
    res.json({ message: 'Entry approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
