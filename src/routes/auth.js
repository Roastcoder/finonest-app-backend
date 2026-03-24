import express from 'express';
import { login, signup, getProfile, checkPan, checkAadhaar, updatePhone, sendMobileOtp, verifyMobileOtp, uploadPhoto, photoUploadMiddleware, updateProfilePhoto } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/check-pan', checkPan);
router.post('/check-aadhaar', checkAadhaar);
router.post('/send-mobile-otp', sendMobileOtp);
router.post('/verify-mobile-otp', verifyMobileOtp);
router.post('/upload-photo', photoUploadMiddleware, uploadPhoto);
router.get('/profile', authenticate, getProfile);
router.put('/profile/phone', authenticate, updatePhone);
router.put('/profile/photo', authenticate, photoUploadMiddleware, updateProfilePhoto);

export default router;
