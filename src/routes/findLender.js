import express from 'express';
import { authenticate, authorize  } from '../middleware/enhancedAuth.js';
import {
  findLendersNearby,
  findLendersByAddress,
  getLenderDetails,
  updateBranchCoordinates,
  geocodeBranch,
  getSearchHistory,
  saveSearch
} from '../controllers/findLenderController.js';

const router = express.Router();

// Public routes (authenticated users)
router.post('/search', authenticate, findLendersNearby);
router.post('/search-by-address', authenticate, findLendersByAddress);
router.get('/details/:bank_id', authenticate, getLenderDetails);
router.post('/save-search', authenticate, saveSearch);
router.get('/history', authenticate, getSearchHistory);

// Admin routes
router.put('/branch/:branch_id/coordinates', authenticate, authorize('admin'), updateBranchCoordinates);
router.post('/branch/:branch_id/geocode', authenticate, authorize('admin'), geocodeBranch);

export default router;
