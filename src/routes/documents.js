import express from 'express';
import { upload } from '../middleware/upload.js';
import { uploadDocument, getLeadDocuments, updateDocumentStatus, deleteDocument } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import db from '../config/database.js';
import { toPostgresParams } from '../utils/postgres.js';

const router = express.Router();

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const documentData = {
      lead_id: req.body.lead_id,
      document_type: req.body.document_type,
      file_path: req.file.path,
      file_name: req.file.originalname,
      file_size: req.file.size,
      uploaded_by: req.user.id
    };

    const { keys, values, params } = toPostgresParams(documentData);
    const result = await db.query(
      `INSERT INTO documents (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );

    res.status(201).json({ message: 'Document uploaded successfully', documentId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/lead/:leadId', authenticate, getLeadDocuments);
router.patch('/:id/status', authenticate, updateDocumentStatus);
router.delete('/:id', authenticate, deleteDocument);

export default router;
