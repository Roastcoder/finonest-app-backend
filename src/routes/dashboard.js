import express from 'express';
import { getDashboardStats, getConvertedLeads } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/converted-leads', getConvertedLeads);

export default router;
