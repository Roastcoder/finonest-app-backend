import express from 'express';
import { verifyPan, sendAadhaarOtp, verifyAadhaarOtp } from '../controllers/kycController.js';
import { verifyAndSavePan, saveAadhaarData } from '../controllers/kycVerificationController.js';

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
router.post('/verify-pan', verifyPan);
router.post('/verify-and-save-pan', verifyAndSavePan);

// Aadhaar verification endpoints
router.post('/send-aadhaar-otp', sendAadhaarOtp);
router.post('/verify-aadhaar-otp', verifyAadhaarOtp);
router.post('/save-aadhaar-data', saveAadhaarData);

export default router;