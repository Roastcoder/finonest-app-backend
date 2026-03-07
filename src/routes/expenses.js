import express from 'express';
import { getAllExpenses, createExpense, approveExpense, rejectExpense } from '../controllers/expenseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllExpenses);
router.post('/', createExpense);
router.patch('/:id/approve', authorize('sales_manager', 'ops_team', 'admin'), approveExpense);
router.patch('/:id/reject', authorize('sales_manager', 'ops_team', 'admin'), rejectExpense);

export default router;
