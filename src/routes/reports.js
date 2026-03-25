import express from 'express';
import { getLoanReport, getCommissionReport, getSalesReport, getAnalyticsReport } from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAnalyticsReport);
router.get('/loans', authorize('admin', 'manager', 'accountant'), getLoanReport);
router.get('/commissions', authorize('admin', 'manager', 'accountant'), getCommissionReport);
router.get('/sales', authorize('admin', 'manager'), getSalesReport);

export default router;
