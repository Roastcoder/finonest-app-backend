import express from 'express';
import { verifyRC } from '../controllers/rcVerificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.post('/verify', verifyRC);

export default router;
