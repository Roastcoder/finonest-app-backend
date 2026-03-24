import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

export class HybridWhatsAppService {
  
  // Send template message (works anytime - bypasses 24-hour rule)
  static async sendTemplate(phone, templateName, parameters = []) {
    try {
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: templateName,
          phone_number: phone,
          parameters: parameters
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

  // Send regular message (needs 24-hour window)
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

  // 🎯 STEP 1: Send Welcome Template (bypasses 24-hour rule)
  static async sendWelcomeTemplate(phone, customerData) {
    console.log('📱 Step 1: Sending welcome template to open conversation...');
    
    // Try different working templates for welcome
    const welcomeTemplates = [
      {
        name: 'newucl',
        params: [
          customerData.name,
          customerData.vehicleReg || 'N/A',
          customerData.vehicleModel || 'Vehicle',
          customerData.loanAmount || '0'
        ]
      },
      {
        name: 'data_rc',
        params: [
          customerData.name,
          customerData.loanId || 'NEW001',
          customerData.vehicleReg || 'N/A',
          customerData.vehicleModel || 'Vehicle',
          customerData.vehicleMaker || 'Maker',
          customerData.regDate || 'N/A',
          customerData.rto || 'N/A'
        ]
      }
    ];

    for (const template of welcomeTemplates) {
      const result = await this.sendTemplate(phone, template.name, template.params);
      if (result.success) {
        console.log(`✅ Welcome template '${template.name}' sent successfully!`);
        return result;
      } else {
        console.log(`❌ Template '${template.name}' failed: ${result.error}`);
      }
    }

    return { success: false, error: 'All welcome templates failed' };
  }

  // 🎯 STEP 2: Send Loan Notification (direct message after template)
  static async sendLoanNotificationAfterWelcome(phone, loanData, delay = 3000) {
    console.log('⏳ Step 2: Waiting before sending loan notification...');
    
    // Wait a few seconds after template to ensure conversation is open
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log('📤 Step 2: Sending loan notification message...');
    
    const message = `🎉 *LOAN UPDATE - FINONEST INDIA*

Hello ${loanData.customerName}! 👋

Your loan application has been processed:

📋 *LOAN DETAILS:*
• Loan ID: ${loanData.loanId}
• Vehicle: ${loanData.vehicleDetails}
• Amount: ₹${loanData.amount}
• Status: ${loanData.status}

${loanData.status === 'APPROVED' ? '🎊 *CONGRATULATIONS!* Your loan is approved!' : ''}
${loanData.status === 'PENDING' ? '⏳ *Under Review* - We will update you soon.' : ''}
${loanData.status === 'REJECTED' ? '❌ *Not Approved* - Please contact us for details.' : ''}

📄 *NEXT STEPS:*
${loanData.nextSteps || '• Contact our team for further assistance'}

📞 *CONTACT:* +919462553887
🏢 *FINONEST INDIA*

Thank you for choosing us! 🙏`;

    return await this.sendMessage(phone, message);
  }

  // 🚀 COMPLETE FLOW: Welcome Template + Loan Notification
  static async sendCompleteNotification(phone, customerData, loanData) {
    console.log('🚀 Starting complete notification flow...\n');
    
    // Step 1: Send welcome template to bypass 24-hour rule
    const welcomeResult = await this.sendWelcomeTemplate(phone, customerData);
    
    if (!welcomeResult.success) {
      console.log('❌ Welcome template failed, trying direct message...');
      return await this.sendLoanNotificationAfterWelcome(phone, loanData, 0);
    }

    // Step 2: Send loan notification as regular message
    const notificationResult = await this.sendLoanNotificationAfterWelcome(phone, loanData);
    
    return {
      welcomeSuccess: welcomeResult.success,
      welcomeMessageId: welcomeResult.messageId,
      notificationSuccess: notificationResult.success,
      notificationMessageId: notificationResult.messageId,
      overallSuccess: welcomeResult.success && notificationResult.success
    };
  }

  // 🎯 SPECIFIC LOAN SCENARIOS

  // Loan Approval Flow
  static async sendLoanApprovalFlow(phone, customerData) {
    const loanData = {
      customerName: customerData.name,
      loanId: customerData.loanId,
      vehicleDetails: customerData.vehicleDetails,
      amount: customerData.amount,
      status: '✅ APPROVED',
      nextSteps: '• Submit required documents\n• Complete verification process\n• Loan disbursement will follow'
    };

    return await this.sendCompleteNotification(phone, customerData, loanData);
  }

  // Document Request Flow
  static async sendDocumentRequestFlow(phone, customerData) {
    const loanData = {
      customerName: customerData.name,
      loanId: customerData.loanId,
      vehicleDetails: customerData.vehicleDetails,
      amount: customerData.amount,
      status: '📄 DOCUMENTS REQUIRED',
      nextSteps: `• Submit: ${customerData.documentsNeeded}\n• Timeline: ${customerData.days} days\n• Upload via our portal or visit branch`
    };

    return await this.sendCompleteNotification(phone, customerData, loanData);
  }

  // EMI Reminder Flow
  static async sendEMIReminderFlow(phone, customerData) {
    const loanData = {
      customerName: customerData.name,
      loanId: customerData.loanId,
      vehicleDetails: customerData.vehicleDetails,
      amount: `₹${customerData.emiAmount} (EMI)`,
      status: '💰 PAYMENT DUE',
      nextSteps: `• Due Date: ${customerData.dueDate}\n• Pay online or visit branch\n• Avoid late fees - pay on time`
    };

    return await this.sendCompleteNotification(phone, customerData, loanData);
  }
}

// Quick test function
export async function testHybridFlow() {
  console.log('🧪 Testing Hybrid WhatsApp Flow...\n');
  
  const customerData = {
    name: 'Yogi Faujdar',
    loanId: 'LOAN123',
    vehicleDetails: 'Maruti Swift VXI',
    vehicleReg: 'MH12AB1234',
    vehicleModel: 'Swift VXI',
    vehicleMaker: 'Maruti Suzuki',
    amount: '5,00,000',
    regDate: '15-Jan-2020',
    rto: 'Mumbai RTO'
  };

  const result = await HybridWhatsAppService.sendLoanApprovalFlow('916378110608', customerData);
  
  console.log('\n📊 RESULTS:');
  console.log('Welcome Template:', result.welcomeSuccess ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Loan Notification:', result.notificationSuccess ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Overall Flow:', result.overallSuccess ? '✅ COMPLETE SUCCESS' : '⚠️ PARTIAL SUCCESS');
  
  return result;
}

// Export for easy use
export const sendLoanApprovalFlow = HybridWhatsAppService.sendLoanApprovalFlow;
export const sendDocumentRequestFlow = HybridWhatsAppService.sendDocumentRequestFlow;
export const sendEMIReminderFlow = HybridWhatsAppService.sendEMIReminderFlow;