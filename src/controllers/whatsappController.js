import WhatsAppService from '../services/whatsappNotificationService.js';
import BotBizWhatsAppAPI from '../integrations/whatsappApi.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/temp/' });

// Webhook to receive WhatsApp messages
export const handleWebhook = async (req, res) => {
  try {
    const { body } = req;
    
    // Verify webhook (required by WhatsApp)
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }

    // Process incoming messages
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            messages?.forEach(message => {
              console.log('Received WhatsApp message:', message);
              // Handle incoming messages here
            });
          }
        });
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Send manual WhatsApp message
export const sendMessage = async (req, res) => {
  try {
    const { phone, message, type = 'text' } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const result = await BotBizWhatsAppAPI.sendTextMessage(phone, message);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send loan-specific notifications
export const sendLoanNotification = async (req, res) => {
  try {
    const { leadId, type, data } = req.body;

    switch (type) {
      case 'application_confirmation':
        await WhatsAppService.sendLoanApplicationConfirmation(leadId);
        break;
      case 'document_request':
        await WhatsAppService.sendDocumentRequest(leadId, data.documentType);
        break;
      case 'approval':
        await WhatsAppService.sendLoanApproval(leadId, data.amount);
        break;
      case 'disbursement':
        await WhatsAppService.sendDisbursementNotification(leadId, data.amount, data.accountNumber);
        break;
      case 'rejection':
        await WhatsAppService.sendLoanRejection(leadId, data.reason);
        break;
      case 'payment_reminder':
        await WhatsAppService.sendPaymentReminder(leadId, data.amount, data.dueDate);
        break;
      case 'stage_change':
        await WhatsAppService.sendStageChangeNotification(leadId, data.newStage);
        break;
      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Loan notification error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send document via WhatsApp
export const sendDocument = async (req, res) => {
  try {
    const { phone, caption = '' } = req.body;
    const file = req.file;

    if (!phone || !file) {
      return res.status(400).json({ error: 'Phone and document are required' });
    }

    // Upload file to a temporary URL or use existing document URL
    const documentUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/temp/${file.filename}`;
    
    const result = await BotBizWhatsAppAPI.sendDocumentMessage(phone, documentUrl, file.originalname, caption);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Send document error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get WhatsApp API status
export const getStatus = async (req, res) => {
  try {
    // Check if BotBiz WhatsApp API is configured
    const isConfigured = !!(process.env.BOTBIZ_API_TOKEN && process.env.BOTBIZ_PHONE_NUMBER_ID);
    
    res.json({
      configured: isConfigured,
      phoneNumberId: process.env.BOTBIZ_PHONE_NUMBER_ID || null,
      status: isConfigured ? 'ready' : 'not_configured'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};