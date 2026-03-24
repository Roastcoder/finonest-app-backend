import express from 'express';
import { processChatMessage } from '../controllers/chatbotController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin chatbot endpoint
router.post('/chat', authenticate, authorize('admin'), processChatMessage);

export default router;