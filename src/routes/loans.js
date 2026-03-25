import express from 'express';
import { getAllLoans, getLoanById, createLoan, deleteLoan, updateLoan, updateLoanStage } from '../controllers/loanController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { uploadMiddleware, uploadDocument } from '../controllers/documentController.js';
import db from '../config/database.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLoans);
router.get('/:id/documents', async (req, res) => {
  try {
    const loanResult = await db.query('SELECT lead_id FROM loans WHERE id = $1', [req.params.id]);
    if (loanResult.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
    const { lead_id } = loanResult.rows[0];

    // Fetch documents with strict deduplication
    let docs;
    const hasLoanIdCol = await db.query(`SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='loan_id'`);
    if (hasLoanIdCol.rows.length > 0) {
      // Priority: loan_id documents first, then lead_id documents only if no loan_id version exists
      docs = await db.query(
        `WITH loan_docs AS (
          SELECT DISTINCT ON (document_type, file_name) d.*, 
                 COALESCE(u.full_name, u.user_id) as uploaded_by_name,
                 1 as priority
          FROM documents d
          LEFT JOIN users u ON d.uploaded_by = u.id
          WHERE d.loan_id = $1
          ORDER BY document_type, file_name, d.created_at DESC
        ),
        lead_docs AS (
          SELECT DISTINCT ON (document_type, file_name) d.*, 
                 COALESCE(u.full_name, u.user_id) as uploaded_by_name,
                 2 as priority
          FROM documents d
          LEFT JOIN users u ON d.uploaded_by = u.id
          WHERE $2::int IS NOT NULL AND d.lead_id = $2 AND d.loan_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM documents ld 
            WHERE ld.loan_id = $1 
            AND ld.document_type = d.document_type
          )
          ORDER BY document_type, file_name, d.created_at DESC
        )
        SELECT * FROM loan_docs
        UNION ALL
        SELECT * FROM lead_docs
        ORDER BY priority, document_type, created_at DESC`,
        [req.params.id, lead_id || null]
      );
    } else {
      if (!lead_id) return res.json([]);
      docs = await db.query(
        `SELECT DISTINCT ON (document_type, file_name) d.*, 
               COALESCE(u.full_name, u.user_id) as uploaded_by_name
         FROM documents d
         LEFT JOIN users u ON d.uploaded_by = u.id
         WHERE d.lead_id = $1
         ORDER BY document_type, file_name, d.created_at DESC`,
        [lead_id]
      );
    }
    res.json(docs.rows);
  } catch (error) {
    console.error('Get loan documents error:', error);
    res.status(500).json({ error: error.message });
  }
});
router.post('/:id/documents', uploadMiddleware, uploadDocument);
router.get('/:id', getLoanById);
router.post('/', auditLogger('loans', 'CREATE_LOAN'), createLoan);
router.put('/:id', auditLogger('loans', 'UPDATE_LOAN'), updateLoan);
router.delete('/:id', auditLogger('loans', 'DELETE_LOAN'), deleteLoan);
router.put('/:id/stage', auditLogger('loans', 'UPDATE_STAGE'), updateLoanStage);

export default router;
