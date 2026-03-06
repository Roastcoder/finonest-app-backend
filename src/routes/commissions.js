import express from 'express';
import { getAllCommissions, getCommissionById, createCommission, updateCommission, deleteCommission } from '../controllers/commissionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllCommissions);
router.get('/:id', getCommissionById);
router.post('/', authorize('admin', 'manager', 'accountant'), createCommission);
router.put('/:id', authorize('admin', 'manager', 'accountant'), updateCommission);
router.delete('/:id', authorize('admin'), deleteCommission);

export default router;
