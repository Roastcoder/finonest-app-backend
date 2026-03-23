import express from 'express';
import { login, signup, getProfile, checkPan, checkAadhaar, updatePhone } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/check-pan', checkPan);
router.post('/check-aadhaar', checkAadhaar);
router.get('/profile', authenticate, getProfile);
router.put('/profile/phone', authenticate, updatePhone);

export default router;
