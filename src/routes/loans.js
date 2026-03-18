import express from 'express';
import { getAllLoans, getLoanById, createLoan, deleteLoan, updateLoan, updateLoanStage } from '../controllers/loanController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import db from '../config/database.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLoans);
router.get('/:id/documents', async (req, res) => {
  try {
    const loanResult = await db.query('SELECT lead_id FROM loans WHERE id = $1', [req.params.id]);
    if (loanResult.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
    const { lead_id } = loanResult.rows[0];
    if (!lead_id) return res.json([]);
    const docs = await db.query(
      `SELECT d.*, COALESCE(u.full_name, u.user_id) as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.lead_id = $1
       ORDER BY d.document_type, d.created_at DESC`,
      [lead_id]
    );
    res.json(docs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/:id', getLoanById);
router.post('/', auditLogger('loans', 'CREATE_LOAN'), createLoan);
router.put('/:id', auditLogger('loans', 'UPDATE_LOAN'), updateLoan);
router.delete('/:id', auditLogger('loans', 'DELETE_LOAN'), deleteLoan);
router.put('/:id/stage', auditLogger('loans', 'UPDATE_STAGE'), updateLoanStage);

export default router;
