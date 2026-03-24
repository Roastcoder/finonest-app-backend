import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  sendLoanApplicationReceived,
  sendDocumentRequired,
  sendLoanApproved,
  sendLoanDisbursed,
  sendEMIReminder,
  sendStatusUpdate,
  sendWelcomeCustomer,
  sendLoanRejected,
  sendOTP,
  sendLoanOffer,
  sendCustomTemplate,
  getAvailableTemplates,
  testTemplate
} from '../controllers/templateController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Loan-specific template routes
router.post('/loan-application-received', sendLoanApplicationReceived);
router.post('/document-required', sendDocumentRequired);
router.post('/loan-approved', sendLoanApproved);
router.post('/loan-disbursed', sendLoanDisbursed);
router.post('/emi-reminder', sendEMIReminder);
router.post('/status-update', sendStatusUpdate);
router.post('/loan-rejected', sendLoanRejected);

// Customer management templates
router.post('/welcome-customer', sendWelcomeCustomer);
router.post('/loan-offer', sendLoanOffer);

// Authentication templates
router.post('/send-otp', sendOTP);

// Generic template routes
router.post('/send-custom', sendCustomTemplate);
router.get('/available', getAvailableTemplates);
router.post('/test', testTemplate);

export default router;