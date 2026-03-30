import express from 'express';
import { verifyPan, sendAadhaarOtp, verifyAadhaarOtp, verifyAadhaar } from '../controllers/kycController.js';
import { verifyAndSavePan, saveAadhaarData } from '../controllers/kycVerificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'KYC service is running',
    provider: 'SurePass + Neokred',
    kyc_configured: !!(process.env.SUREPASS_TOKEN && process.env.KYC_BASE_URL),
    services: {
      pan_verification: !!process.env.SUREPASS_TOKEN,
      aadhaar_otp: !!process.env.KYC_AADHAAR_OTP_SERVICE_ID,
      aadhaar_kyc: !!process.env.KYC_AADHAAR_KYC_SERVICE_ID
    }
  });
});

// PAN verification endpoints
router.post('/verify-pan', (req, res, next) => {
  // Try authenticate but don't fail if no token (signup flow)
  const authHeader = req.headers['authorization'];
  if (authHeader) return authenticate(req, res, next);
  next();
}, verifyPan);
router.post('/verify-and-save-pan', authenticate, verifyAndSavePan);

// Aadhaar verification endpoints
router.post('/send-aadhaar-otp', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) return authenticate(req, res, next);
  next();
}, sendAadhaarOtp);
router.post('/verify-aadhaar-otp', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) return authenticate(req, res, next);
  next();
}, verifyAadhaarOtp);
router.post('/verify-aadhaar', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) return authenticate(req, res, next);
  next();
}, verifyAadhaar);
router.post('/save-aadhaar-data', authenticate, saveAadhaarData);

export default router;
