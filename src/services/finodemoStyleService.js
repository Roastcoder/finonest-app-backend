import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

// 🚀 WORKING SOLUTION: Mimic FINODEMO template with regular messages
export class FinodemoStyleService {
  
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

  // 🎯 FINODEMO Style Message (matches your template structure)
  static async sendFinodemoStyle(phone, data) {
    const message = `Hello ${data.username}

${data.field1}

${data.field2}
${data.field3}
${data.field4}
${data.field5}
${data.field6}

${data.field7}

You can check the details below for your convenience.
${data.field8}

🙂 Thanks for taking a moment to read this message.`;

    return await this.sendMessage(phone, message);
  }

  // 🎉 Loan Approval (FINODEMO Style)
  static async sendLoanApproval(phone, loanData) {
    return await this.sendFinodemoStyle(phone, {
      username: loanData.customerName,
      field1: '🎉 Loan Approved!',
      field2: `Loan ID: ${loanData.loanId}`,
      field3: `Vehicle: ${loanData.vehicleDetails}`,
      field4: `Amount: ₹${loanData.amount}`,
      field5: 'Status: APPROVED',
      field6: 'Next: Submit documents',
      field7: 'Contact: +919462553887',
      field8: 'Congratulations from Finonest India!'
    });
  }

  // 📄 Document Request (FINODEMO Style)
  static async sendDocumentRequest(phone, loanData) {
    return await this.sendFinodemoStyle(phone, {
      username: loanData.customerName,
      field1: '📄 Documents Required',
      field2: `Loan ID: ${loanData.loanId}`,
      field3: `Vehicle: ${loanData.vehicleDetails}`,
      field4: `Documents: ${loanData.documentsNeeded}`,
      field5: 'Status: PENDING',
      field6: `Timeline: ${loanData.days} days`,
      field7: 'Contact: +919462553887',
      field8: 'Please submit soon - Finonest India!'
    });
  }

  // 💰 EMI Reminder (FINODEMO Style)
  static async sendEMIReminder(phone, loanData) {
    return await this.sendFinodemoStyle(phone, {
      username: loanData.customerName,
      field1: '💰 EMI Reminder',
      field2: `Loan ID: ${loanData.loanId}`,
      field3: `Vehicle: ${loanData.vehicleDetails}`,
      field4: `EMI Amount: ₹${loanData.emiAmount}`,
      field5: 'Status: DUE',
      field6: `Due Date: ${loanData.dueDate}`,
      field7: 'Contact: +919462553887',
      field8: 'Pay on time - Finonest India!'
    });
  }

  // 🚗 RC Verification (FINODEMO Style)
  static async sendRCVerification(phone, customerData) {
    return await this.sendFinodemoStyle(phone, {
      username: customerData.name,
      field1: '🚗 RC Verification',
      field2: `Service ID: ${customerData.srNo}`,
      field3: `Reg No: ${customerData.rcNo}`,
      field4: `Model: ${customerData.model}`,
      field5: `Maker: ${customerData.maker}`,
      field6: `RTO: ${customerData.rto}`,
      field7: 'Contact: +919462553887',
      field8: 'Please confirm details - Finonest India!'
    });
  }
}

// Test function
export async function testFinodemoStyle() {
  console.log('🧪 Testing FINODEMO Style Messages (Regular Messages)...\n');
  
  // Test Loan Approval
  const result = await FinodemoStyleService.sendLoanApproval('916378110608', {
    customerName: 'Yogi Faujdar',
    loanId: 'LOAN123',
    vehicleDetails: 'Maruti Swift VXI',
    amount: '5,00,000'
  });
  
  console.log('📊 RESULT:');
  console.log('Success:', result.success ? '✅ YES' : '❌ NO');
  console.log('Message ID:', result.messageId || 'N/A');
  console.log('Error:', result.error || 'None');
  
  if (result.success) {
    console.log('\n🎊 PERFECT! FINODEMO style messages work!');
    console.log('🚀 You can use this for all Car Credit Hub notifications!');
  }
  
  return result;
}

// Export for easy use
export const sendLoanApproval = FinodemoStyleService.sendLoanApproval;
export const sendDocumentRequest = FinodemoStyleService.sendDocumentRequest;
export const sendEMIReminder = FinodemoStyleService.sendEMIReminder;
export const sendRCVerification = FinodemoStyleService.sendRCVerification;