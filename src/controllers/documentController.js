import db from '../config/database.js';
import { toPostgresParams } from '../utils/postgres.js';

export const uploadDocument = async (req, res) => {
  try {
    const { lead_id, document_type, file_path, file_name, file_size } = req.body;
    const uploaded_by = req.user.id;
    
    const data = { lead_id, document_type, file_path, file_name, file_size, uploaded_by };
    const { keys, values, params } = toPostgresParams(data);
    
    const result = await db.query(
      `INSERT INTO documents (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    
    res.status(201).json({ message: 'Document uploaded successfully', documentId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeadDocuments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.*, u.name as uploaded_by_name 
       FROM documents d 
       LEFT JOIN users u ON d.uploaded_by = u.id 
       WHERE d.lead_id = $1 
       ORDER BY d.created_at DESC`,
      [req.params.leadId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE documents SET status = $1 WHERE id = $2',
      [status, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
