import express from 'express';
import { 
  getLoansWithStages, 
  updateApplicationStage, 
  getStageHistory, 
  getStageStatistics 
} from '../controllers/applicationStageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all loans with their application stages
router.get('/loans-with-stages', authenticateToken, getLoansWithStages);

// Update application stage (Admin/Manager only)
router.put('/loans/:loanId/stage', authenticateToken, updateApplicationStage);

// Get stage history for a loan
router.get('/loans/:loanId/stage-history', authenticateToken, getStageHistory);

// Get stage statistics
router.get('/stage-statistics', authenticateToken, getStageStatistics);

export default router;