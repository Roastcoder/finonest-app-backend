import express from 'express';
import { getAllAuditLogs } from '../controllers/auditLogController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('admin'), getAllAuditLogs);

export default router;
