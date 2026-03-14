import express from 'express';
import { calculateDistance } from '../controllers/distanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.post('/calculate', authorize('admin', 'manager'), calculateDistance);

export default router;
