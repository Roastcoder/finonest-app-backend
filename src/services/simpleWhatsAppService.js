import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

// 🚀 SIMPLE SOLUTION: Use only regular messages (they work perfectly!)
export class SimpleWhatsAppService {
  
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

  // 🎯 LOAN APPROVAL - Works immediately!
  static async sendLoanApproval(phone, loanData) {
    const message = `🎉 *LOAN APPROVED - FINONEST INDIA*

Hello ${loanData.customerName}! 👋

🎊 *CONGRATULATIONS!* Your loan has been APPROVED!

📋 *LOAN DETAILS:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}  
• Amount: ₹${loanData.amount}
• Status: ✅ APPROVED

📄 *NEXT STEPS:*
• Submit required documents
• Complete verification process
• Loan disbursement will follow

📞 *CONTACT:* +919462553887
🏢 *FINONEST INDIA*

Thank you for choosing us! 🚗💰`;

    return await this.sendMessage(phone, message);
  }

  // 🎯 RC VERIFICATION - Works immediately!
  static async sendRCVerification(phone, customerData) {
    const message = `🚗 *RC VERIFICATION - FINONEST INDIA*

Hello ${customerData.name}!

This message is regarding your service request *${customerData.srNo}*, initiated by you.

Please verify your RC details below:

📋 *VEHICLE DETAILS:*
• Reg No: ${customerData.rcNo}
• Car Model: ${customerData.model}
• Maker: ${customerData.maker}
• Reg Date: ${customerData.regDate}
• RTO: ${customerData.rto}

Kindly confirm to proceed with your service request.

📞 *CONTACT:* +919462553887
🏢 *FINONEST INDIA*`;

    return await this.sendMessage(phone, message);
  }

  // 🎯 DOCUMENT REQUEST - Works immediately!
  static async sendDocumentRequest(phone, loanData) {
    const message = `📄 *DOCUMENTS REQUIRED - FINONEST INDIA*

Hello ${loanData.customerName}!

For your loan application to proceed:

📋 *LOAN DETAILS:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}

📎 *REQUIRED DOCUMENTS:*
${loanData.documentsNeeded}

⏰ *TIMELINE:* Submit within ${loanData.days} days

📞 *CONTACT:* +919462553887
🏢 *FINONEST INDIA*

Please upload documents soon! 📤`;

    return await this.sendMessage(phone, message);
  }

  // 🎯 EMI REMINDER - Works immediately!
  static async sendEMIReminder(phone, loanData) {
    const message = `💰 *EMI REMINDER - FINONEST INDIA*

Hello ${loanData.customerName}!

Your EMI payment is due:

📋 *LOAN DETAILS:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}
• EMI Amount: ₹${loanData.emiAmount}
• Due Date: ${loanData.dueDate}

⚠️ *STATUS:* Payment Due

📞 *CONTACT:* +919462553887
🏢 *FINONEST INDIA*

Please pay on time! 🏦`;

    return await this.sendMessage(phone, message);
  }
}

// Test function
export async function testSimpleFlow() {
  console.log('🧪 Testing Simple WhatsApp Flow (Regular Messages Only)...\n');
  
  // Test Loan Approval
  const result = await SimpleWhatsAppService.sendLoanApproval('916378110608', {
    customerName: 'Yogi Faujdar',
    loanId: 'LOAN123',
    vehicleDetails: 'Maruti Swift VXI',
    amount: '5,00,000'
  });
  
  console.log('📊 RESULT:');
  console.log('Success:', result.success ? '✅ YES' : '❌ NO');
  console.log('Message ID:', result.messageId || 'N/A');
  console.log('Error:', result.error || 'None');
  
  return result;
}

// Export for easy use
export const sendLoanApproval = SimpleWhatsAppService.sendLoanApproval;
export const sendRCVerification = SimpleWhatsAppService.sendRCVerification;
export const sendDocumentRequest = SimpleWhatsAppService.sendDocumentRequest;
export const sendEMIReminder = SimpleWhatsAppService.sendEMIReminder;