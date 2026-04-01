import express from 'express';
import { getAllBanks, getBankById, createBank, updateBank, deleteBank, upload, getBankBranches, createBranch, updateBranch, deleteBranch, importBanksWithBranches } from '../controllers/bankController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public endpoint - no authentication required
router.get('/', getAllBanks);

// Protected endpoints - authentication required
router.use(authenticate);

router.get('/:id', getBankById);
router.post('/', authorize('admin', 'manager'), upload.single('logo'), createBank);
router.post('/import/excel', authorize('admin', 'manager'), upload.single('file'), importBanksWithBranches);
router.put('/:id', authorize('admin', 'manager'), upload.single('logo'), updateBank);
router.delete('/:id', authorize('admin'), deleteBank);

// Branch routes
router.get('/:id/branches', getBankBranches);
router.post('/:id/branches', authorize('admin', 'manager'), createBranch);
router.put('/:id/branches/:branchId', authorize('admin', 'manager'), updateBranch);
router.delete('/:id/branches/:branchId', authorize('admin'), deleteBranch);

export default router;
