import express from 'express';
import { verifyRC, getRCData } from '../controllers/rcVerificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.post('/verify', verifyRC);
router.get('/data/:rc_number', getRCData);

export default router;
