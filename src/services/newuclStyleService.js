import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

// 🚀 WORKING SOLUTION: NEWUCL Style Messages (Regular Messages)
export class NewuclStyleService {
  
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

  // 🎯 NEWUCL Style Loan Notification (Exact Template Structure)
  static async sendLoanNotification(phone, loanData) {
    const message = `Hello! ${loanData.customerName}

Your application for loan is under review. Here is your approved loan details.
Regis. No = ${loanData.regNo}
Car Model = ${loanData.carModel}
Loan Amt. = ${loanData.loanAmount}

Request you to please review and confirm.

📞 Contact: +919462553887
🏢 Finonest India`;

    return await this.sendMessage(phone, message);
  }

  // 🎉 Loan Approval (NEWUCL Style)
  static async sendLoanApproval(phone, loanData) {
    const message = `Hello! ${loanData.customerName}

🎉 Your loan application has been APPROVED! Here are your loan details.
Regis. No = ${loanData.regNo}
Car Model = ${loanData.carModel}
Loan Amt. = ${loanData.loanAmount}

Congratulations! Please proceed with document submission.

📞 Contact: +919462553887
🏢 Finonest India`;

    return await this.sendMessage(phone, message);
  }

  // 📄 Document Request (NEWUCL Style)
  static async sendDocumentRequest(phone, loanData) {
    const message = `Hello! ${loanData.customerName}

Your loan application requires additional documents. Here are your loan details.
Regis. No = ${loanData.regNo}
Car Model = ${loanData.carModel}
Loan Amt. = ${loanData.loanAmount}

Please submit: ${loanData.documentsNeeded}

📞 Contact: +919462553887
🏢 Finonest India`;

    return await this.sendMessage(phone, message);
  }

  // ⚠️ Loan Pending (NEWUCL Style)
  static async sendLoanPending(phone, loanData) {
    const message = `Hello! ${loanData.customerName}

Your loan application is under review. Here are your loan details.
Regis. No = ${loanData.regNo}
Car Model = ${loanData.carModel}
Loan Amt. = ${loanData.loanAmount}

We will update you within 2-3 business days.

📞 Contact: +919462553887
🏢 Finonest India`;

    return await this.sendMessage(phone, message);
  }

  // ❌ Loan Rejection (NEWUCL Style)
  static async sendLoanRejection(phone, loanData) {
    const message = `Hello! ${loanData.customerName}

Your loan application status has been updated. Here are your application details.
Regis. No = ${loanData.regNo}
Car Model = ${loanData.carModel}
Loan Amt. = ${loanData.loanAmount}

Unfortunately, we cannot proceed with this application. Please contact us for details.

📞 Contact: +919462553887
🏢 Finonest India`;

    return await this.sendMessage(phone, message);
  }
}

// Test function
export async function testNewuclStyle() {
  console.log('🧪 Testing NEWUCL Style Messages (Regular Messages)...\n');
  
  const testData = {
    customerName: 'Yogi Faujdar',
    regNo: 'MH12AB1234',
    carModel: 'Maruti Swift VXI',
    loanAmount: '₹5,00,000'
  };

  // Test 1: Basic loan notification
  console.log('📤 Test 1: Basic loan notification...');
  const result1 = await NewuclStyleService.sendLoanNotification('916378110608', testData);
  
  if (result1.success) {
    console.log('✅ SUCCESS! Basic notification sent!');
    console.log('📧 Message ID:', result1.messageId);
  } else {
    console.log('❌ Failed:', result1.error);
  }

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: Loan approval
  console.log('\n📤 Test 2: Loan approval...');
  const result2 = await NewuclStyleService.sendLoanApproval('916378110608', testData);
  
  if (result2.success) {
    console.log('✅ SUCCESS! Loan approval sent!');
    console.log('📧 Message ID:', result2.messageId);
  } else {
    console.log('❌ Failed:', result2.error);
  }

  const overallSuccess = result1.success || result2.success;
  
  console.log('\n📊 OVERALL RESULT:');
  console.log('Success:', overallSuccess ? '✅ YES' : '❌ NO');
  
  if (overallSuccess) {
    console.log('\n🎊 PERFECT! NEWUCL style messages work!');
    console.log('🚀 You can use this for all Car Credit Hub loan notifications!');
    console.log('\n📋 Available Functions:');
    console.log('• sendLoanNotification() - Basic loan review');
    console.log('• sendLoanApproval() - Loan approved');
    console.log('• sendDocumentRequest() - Documents needed');
    console.log('• sendLoanPending() - Under review');
    console.log('• sendLoanRejection() - Not approved');
  }
  
  return overallSuccess;
}

// Export for easy use
export const sendLoanNotification = NewuclStyleService.sendLoanNotification;
export const sendLoanApproval = NewuclStyleService.sendLoanApproval;
export const sendDocumentRequest = NewuclStyleService.sendDocumentRequest;
export const sendLoanPending = NewuclStyleService.sendLoanPending;
export const sendLoanRejection = NewuclStyleService.sendLoanRejection;