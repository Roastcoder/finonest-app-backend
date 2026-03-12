import express from 'express';
import { 
  getLoansWithStages, 
  updateApplicationStage, 
  getStageHistory, 
  getStageStatistics 
} from '../controllers/applicationStageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all loans with their application stages
router.get('/loans-with-stages', authenticate, getLoansWithStages);

// Update application stage (Admin/Manager only)
router.put('/loans/:loanId/stage', authenticate, updateApplicationStage);

// Get stage history for a loan
router.get('/loans/:loanId/stage-history', authenticate, getStageHistory);

// Get stage statistics
router.get('/stage-statistics', authenticate, getStageStatistics);

export default router;
