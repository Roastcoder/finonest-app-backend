import express from 'express';
import { getAllLoans, getLoanById, createLoan, deleteLoan, updateLoanStage } from '../controllers/loanController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLoans);
router.get('/:id', getLoanById);
router.post('/', auditLogger('loans', 'CREATE_LOAN'), createLoan);
router.delete('/:id', auditLogger('loans', 'DELETE_LOAN'), deleteLoan);
router.put('/:id/stage', auditLogger('loans', 'UPDATE_STAGE'), updateLoanStage);

export default router;
