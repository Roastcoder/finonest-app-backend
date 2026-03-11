import express from 'express';
import { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch } from '../controllers/branchController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.post('/', authorize('admin', 'manager'), createBranch);
router.put('/:id', authorize('admin', 'manager'), updateBranch);
router.delete('/:id', authorize('admin'), deleteBranch);

export default router;
