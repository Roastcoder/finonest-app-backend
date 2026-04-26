import express from 'express';
import { getAllAuditLogs, deleteAuditLogsByDateRange } from '../controllers/auditLogController.js';
import { authenticate, authorize  } from '../middleware/enhancedAuth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('admin'), getAllAuditLogs);
router.delete('/delete-range', authorize('admin'), deleteAuditLogsByDateRange);

export default router;
