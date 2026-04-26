import express from 'express';
import { getAllBanks, getBankById, createBank, updateBank, deleteBank, upload, excelUpload, getBankBranches, createBranch, updateBranch, deleteBranch, importBanksWithBranches } from '../controllers/bankController.js';
import { authenticate, authorize  } from '../middleware/enhancedAuth.js';

const router = express.Router();

// Public endpoint - no authentication required
router.get('/', getAllBanks);

// Protected endpoints - authentication required
router.use(authenticate);

router.post('/', authorize('admin', 'manager'), upload.single('logo'), createBank);
router.post('/import/excel', authorize('admin', 'manager'), excelUpload.single('file'), importBanksWithBranches);
router.get('/:id', getBankById);
router.put('/:id', authorize('admin', 'manager'), upload.single('logo'), updateBank);
router.delete('/:id', authorize('admin'), deleteBank);

// Branch routes - must come after specific routes
router.get('/:id/branches', getBankBranches);
router.post('/:id/branches', authorize('admin', 'manager'), createBranch);
router.put('/:id/branches/:branchId', authorize('admin', 'manager'), updateBranch);
router.delete('/:id/branches/:branchId', authorize('admin'), deleteBranch);

export default router;
