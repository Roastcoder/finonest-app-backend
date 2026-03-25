import BotBizWhatsAppAPI from '../integrations/whatsappApi.js';

// Get conversation history
export const getConversation = async (req, res) => {
  try {
    const { phone } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await BotBizWhatsAppAPI.getConversation(phone, parseInt(limit), parseInt(offset));
    res.json({ success: true, result });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get message status
export const getMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { botId } = req.query;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    const result = await BotBizWhatsAppAPI.getMessageStatus(messageId, botId || process.env.BOTBIZ_WHATSAPP_BOT_ID);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Get message status error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get available templates
export const getTemplates = async (req, res) => {
  try {
    const result = await BotBizWhatsAppAPI.getTemplateList();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get subscriber info
export const getSubscriber = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await BotBizWhatsAppAPI.getSubscriber(phone);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Get subscriber error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Trigger bot flow
export const triggerBot = async (req, res) => {
  try {
    const { phone, botFlowId } = req.body;

    if (!phone || !botFlowId) {
      return res.status(400).json({ error: 'Phone number and bot flow ID are required' });
    }

    const result = await BotBizWhatsAppAPI.triggerBotFlow(phone, botFlowId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Trigger bot error:', error);
    res.status(500).json({ error: error.message });
  }
};