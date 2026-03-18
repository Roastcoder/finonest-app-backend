import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

// Main WhatsApp service for Car Credit Hub
export class WhatsAppService {
  
  // Send any message
  static async sendMessage(phone, message) {
    try {
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          phone_number: phone,
          message: message
        }
      );

      return {
        success: response.data.status === '1',
        messageId: response.data.wa_message_id,
        error: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Loan Approval Notification
  static async sendLoanApproval(phone, loanData) {
    const message = `🎉 *LOAN APPROVED!*

Hello ${loanData.customerName}!

Your loan application has been APPROVED! 🎊

📋 *Loan Details:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}
• Amount: ₹${loanData.amount}
• Status: ✅ APPROVED

📄 *Next Steps:*
• Submit required documents
• Complete verification process
• Loan disbursement will follow

📞 *Contact:* +919462553887
🏢 *Finonest India*

Congratulations! 🚗💰`;

    return await this.sendMessage(phone, message);
  }

  // Loan Rejection Notification
  static async sendLoanRejection(phone, loanData) {
    const message = `❌ *LOAN UPDATE*

Hello ${loanData.customerName},

Your loan application status has been updated.

📋 *Application Details:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}
• Amount: ₹${loanData.amount}
• Status: ❌ NOT APPROVED

📝 *Reason:* ${loanData.reason}

📞 *Contact:* +919462553887
🏢 *Finonest India*

Thank you for choosing us.`;

    return await this.sendMessage(phone, message);
  }

  // Document Request
  static async sendDocumentRequest(phone, loanData) {
    const message = `📄 *DOCUMENTS REQUIRED*

Hello ${loanData.customerName}!

For your loan application to proceed:

📋 *Loan Details:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}

📎 *Required Documents:*
${loanData.documentsNeeded}

⏰ *Timeline:* Submit within ${loanData.days} days
📞 *Contact:* +919462553887
🏢 *Finonest India*

Please upload documents soon! 📤`;

    return await this.sendMessage(phone, message);
  }

  // EMI Reminder
  static async sendEMIReminder(phone, loanData) {
    const message = `💰 *EMI REMINDER*

Hello ${loanData.customerName}!

Your EMI payment is due:

📋 *Loan Details:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}
• EMI Amount: ₹${loanData.emiAmount}
• Due Date: ${loanData.dueDate}

⚠️ *Status:* Payment Due

📞 *Contact:* +919462553887
🏢 *Finonest India*

Please pay on time! 🏦`;

    return await this.sendMessage(phone, message);
  }

  // RC Verification Request
  static async sendRCVerification(phone, customerData) {
    const message = `🚗 *RC VERIFICATION*

Hello ${customerData.name}!

This message is regarding your service request ${customerData.srNo}, initiated by you.

Please verify your RC details below:

📋 *Vehicle Details:*
• Reg No: ${customerData.rcNo}
• Car Model: ${customerData.model}
• Maker: ${customerData.maker}
• Reg Date: ${customerData.regDate}
• RTO: ${customerData.rto}

Kindly confirm to proceed with your service request.

🏢 *Finonest India*`;

    return await this.sendMessage(phone, message);
  }

  // General Loan Status Update
  static async sendLoanStatusUpdate(phone, loanData) {
    const message = `📊 *LOAN STATUS UPDATE*

Hello ${loanData.customerName}!

📋 *Loan Details:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}
• Amount: ₹${loanData.amount}
• Current Status: ${loanData.status}

${loanData.additionalInfo ? `📝 *Note:* ${loanData.additionalInfo}` : ''}

📞 *Contact:* +919462553887
🏢 *Finonest India*

Thank you for choosing us! 🙏`;

    return await this.sendMessage(phone, message);
  }

  // Get conversation history
  static async getConversation(phone, limit = 10) {
    try {
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/get/conversation',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          phone_number: phone,
          limit: limit,
          offset: 0
        }
      );

      return {
        success: response.data.status === '1',
        messages: response.data.message || [],
        error: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// Export individual functions for backward compatibility
export const sendLoanApproval = WhatsAppService.sendLoanApproval;
export const sendLoanRejection = WhatsAppService.sendLoanRejection;
export const sendDocumentRequest = WhatsAppService.sendDocumentRequest;
export const sendEMIReminder = WhatsAppService.sendEMIReminder;
export const sendRCVerification = WhatsAppService.sendRCVerification;
export const sendMessage = WhatsAppService.sendMessage;