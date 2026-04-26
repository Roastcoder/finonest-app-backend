import express from 'express';
import { 
  getLeadTimeline, 
  addTimelineEntry, 
  getLoanTimeline, 
  getAuditLogs, 
  createAuditLog, 
  getSystemActivity 
} from '../controllers/timelineController.js';
import { authenticate, authorize  } from '../middleware/enhancedAuth.js';

const router = express.Router();

router.use(authenticate);

// Lead timeline routes
router.get('/lead/:leadId', getLeadTimeline);
router.post('/lead/:leadId', addTimelineEntry);

// Loan timeline routes
router.get('/loan/:loanId', getLoanTimeline);

// Audit log routes
router.get('/audit', authorize('admin', 'manager'), getAuditLogs);
router.post('/audit', createAuditLog);

// System activity
router.get('/activity', authorize('admin'), getSystemActivity);

export default router;