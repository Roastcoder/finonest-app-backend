import express from 'express';
import { getAllBanks, getBankById, createBank, updateBank, deleteBank } from '../controllers/bankController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllBanks);
router.get('/:id', getBankById);
router.post('/', authorize('admin', 'manager'), createBank);
router.put('/:id', authorize('admin', 'manager'), updateBank);
router.delete('/:id', authorize('admin'), deleteBank);

export default router;
