import express from 'express';
import { requestOTP, verifyOTP, getCustomerApplicationStatus } from '../controllers/customerPortalController.js';

const router = express.Router();

router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.get('/status/:leadId', getCustomerApplicationStatus);

export default router;
