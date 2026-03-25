import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  handleWebhook,
  sendMessage,
  sendDocument,
  sendLoanNotification,
  getStatus
} from '../controllers/whatsappController.js';
import {
  getConversation,
  getMessageStatus,
  getTemplates,
  getSubscriber,
  triggerBot
} from '../controllers/whatsappExtensions.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Webhook endpoint (no auth required)
router.get('/webhook', handleWebhook);
router.post('/webhook', handleWebhook);

// Protected routes
router.use(authenticate);

router.post('/send', sendMessage);
router.post('/send-document', upload.single('document'), sendDocument);
router.post('/send-loan-notification', sendLoanNotification);
router.get('/status', getStatus);

// Extended BotBiz features
router.get('/conversation/:phone', getConversation);
router.get('/message-status/:messageId', getMessageStatus);
router.get('/templates', getTemplates);
router.get('/subscriber/:phone', getSubscriber);
router.post('/trigger-bot', triggerBot);

export default router;