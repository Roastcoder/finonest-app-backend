import axios from 'axios';

class BotBizWhatsAppAPI {
  constructor() {
    this.baseURL = 'https://dash.botbiz.io/api/v1';
    this.apiToken = process.env.BOTBIZ_API_TOKEN;
    this.phoneNumberId = process.env.BOTBIZ_PHONE_NUMBER_ID;
  }

  async sendTextMessage(phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.baseURL}/whatsapp/send`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId,
          message: message,
          phone_number: phoneNumber
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz WhatsApp send error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendTemplateMessage(phoneNumber, templateName, parameters = []) {
    try {
      // BotBiz uses a different endpoint for template messages
      // This would need to be configured based on your specific templates
      const response = await axios.post(
        `${this.baseURL}/whatsapp/send/template`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId,
          template_name: templateName,
          phone_number: phoneNumber,
          parameters: parameters
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz WhatsApp template error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendDocumentMessage(phoneNumber, documentUrl, filename, caption = '') {
    try {
      // BotBiz document sending - may need adjustment based on their actual API
      const response = await axios.post(
        `${this.baseURL}/whatsapp/send/document`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId,
          phone_number: phoneNumber,
          document_url: documentUrl,
          filename: filename,
          caption: caption
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz WhatsApp document error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getConversation(phoneNumber, limit = 10, offset = 0) {
    try {
      const response = await axios.post(
        `${this.baseURL}/whatsapp/get/conversation`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId,
          phone_number: phoneNumber,
          limit: limit,
          offset: offset
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz get conversation error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMessageStatus(waMessageId, whatsappBotId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/whatsapp/get/message-status`,
        {
          apiToken: this.apiToken,
          wa_message_id: waMessageId,
          whatsapp_bot_id: whatsappBotId
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz message status error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getTemplateList() {
    try {
      const response = await axios.post(
        `${this.baseURL}/whatsapp/template/list`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz template list error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSubscriber(phoneNumber) {
    try {
      const response = await axios.post(
        `${this.baseURL}/whatsapp/subscriber/get`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId,
          phone_number: phoneNumber
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz get subscriber error:', error.response?.data || error.message);
      throw error;
    }
  }

  async triggerBotFlow(phoneNumber, botFlowUniqueId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/whatsapp/trigger-bot`,
        {
          apiToken: this.apiToken,
          phone_number_id: this.phoneNumberId,
          bot_flow_unique_id: botFlowUniqueId,
          phone_number: phoneNumber
        }
      );
      return response.data;
    } catch (error) {
      console.error('BotBiz trigger bot error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new BotBizWhatsAppAPI();