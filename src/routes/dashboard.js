import express from 'express';
import { getDashboardStats, getConvertedLeads, getPerformanceData } from '../controllers/dashboardController.js';
import { authenticate, applyDataFilters } from '../middleware/enhancedAuth.js';

const router = express.Router();

// Apply authentication and data filters to all dashboard routes
router.use(authenticate);
router.use(applyDataFilters);

// Dashboard stats (role-based data filtering applied automatically)
router.get('/stats', getDashboardStats);

// Converted leads (executive role only)
router.get('/converted-leads', getConvertedLeads);

// Performance data (role-based data filtering applied automatically)
router.get('/performance', getPerformanceData);

export default router;
