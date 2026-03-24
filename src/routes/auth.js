import express from 'express';
import { 
  login, 
  getProfile,
  step1CheckPan,
  step2SendMobileOtp,
  step3VerifyMobileOtp,
  step4EmailPassword,
  step5SendAadhaarOtp,
  step6VerifyAadhaarOtp,
  step7UploadPhoto,
  step8CompleteProfile,
  photoUploadMiddleware
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', login);

// Multi-step signup flow
router.post('/signup/step1-pan', step1CheckPan);
router.post('/signup/step2-send-mobile-otp', step2SendMobileOtp);
router.post('/signup/step3-verify-mobile-otp', step3VerifyMobileOtp);
router.post('/signup/step4-email-password', step4EmailPassword);
router.post('/signup/step5-send-aadhaar-otp', step5SendAadhaarOtp);
router.post('/signup/step6-verify-aadhaar-otp', step6VerifyAadhaarOtp);
router.post('/signup/step7-upload-photo', photoUploadMiddleware, step7UploadPhoto);
router.post('/signup/step8-complete', step8CompleteProfile);

// Profile
router.get('/profile', authenticate, getProfile);

export default router;
