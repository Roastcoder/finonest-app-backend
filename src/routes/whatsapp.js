import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  handleWebhook,
  sendMessage,
  sendDocument,
  sendLoanNotification,
  getStatus
} from '../controllers/whatsappController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Webhook endpoint (no auth required)
router.get('/webhook', handleWebhook);
router.post('/webhook', handleWebhook);

// Protected routes
router.use(authenticateToken);

router.post('/send', sendMessage);
router.post('/send-document', upload.single('document'), sendDocument);
router.post('/send-loan-notification', sendLoanNotification);
router.get('/status', getStatus);

export default router;