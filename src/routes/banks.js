import express from 'express';
import { getAllBanks, getBankById, createBank, updateBank, deleteBank, upload } from '../controllers/bankController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllBanks);
router.get('/:id', getBankById);
router.post('/', authorize('admin', 'manager'), upload.single('logo'), createBank);
router.put('/:id', authorize('admin', 'manager'), upload.single('logo'), updateBank);
router.delete('/:id', authorize('admin'), deleteBank);

export default router;
