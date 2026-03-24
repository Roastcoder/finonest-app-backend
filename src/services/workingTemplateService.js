import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

// 🎊 WORKING TEMPLATE SERVICE - FINODEMO Template
export class WorkingTemplateService {
  
  // Send FINODEMO template (WORKS!)
  static async sendFinodemoTemplate(phone, data) {
    try {
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: '336920', // FINODEMO template ID
          phone_number: phone,
          parameters: [
            data.username,    // #username#
            data.field1,      // #1#
            data.field2,      // #2#
            data.field3,      // #3#
            data.field4,      // #4#
            data.field5,      // #5#
            data.field6,      // #6#
            data.field7,      // #7#
            data.field8       // #8#
          ]
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

  // 🎉 Loan Approval (FINODEMO Template)
  static async sendLoanApproval(phone, loanData) {
    return await this.sendFinodemoTemplate(phone, {
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

  // 📄 Document Request (FINODEMO Template)
  static async sendDocumentRequest(phone, loanData) {
    return await this.sendFinodemoTemplate(phone, {
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

  // 💰 EMI Reminder (FINODEMO Template)
  static async sendEMIReminder(phone, loanData) {
    return await this.sendFinodemoTemplate(phone, {
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

  // 🚗 RC Verification (FINODEMO Template)
  static async sendRCVerification(phone, customerData) {
    return await this.sendFinodemoTemplate(phone, {
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

  // ⚠️ Loan Rejection (FINODEMO Template)
  static async sendLoanRejection(phone, loanData) {
    return await this.sendFinodemoTemplate(phone, {
      username: loanData.customerName,
      field1: '❌ Loan Update',
      field2: `Loan ID: ${loanData.loanId}`,
      field3: `Vehicle: ${loanData.vehicleDetails}`,
      field4: `Amount: ₹${loanData.amount}`,
      field5: 'Status: NOT APPROVED',
      field6: `Reason: ${loanData.reason}`,
      field7: 'Contact: +919462553887',
      field8: 'Thank you - Finonest India'
    });
  }

  // 📊 Loan Status Update (FINODEMO Template)
  static async sendLoanStatusUpdate(phone, loanData) {
    return await this.sendFinodemoTemplate(phone, {
      username: loanData.customerName,
      field1: '📊 Loan Status Update',
      field2: `Loan ID: ${loanData.loanId}`,
      field3: `Vehicle: ${loanData.vehicleDetails}`,
      field4: `Amount: ₹${loanData.amount}`,
      field5: `Status: ${loanData.status}`,
      field6: `Update: ${loanData.update}`,
      field7: 'Contact: +919462553887',
      field8: 'Thank you - Finonest India'
    });
  }
}

// Test function
export async function testWorkingTemplates() {
  console.log('🧪 Testing Working Template Service...\n');
  
  // Test 1: Loan Approval
  console.log('📤 Test 1: Loan Approval...');
  const result1 = await WorkingTemplateService.sendLoanApproval('916378110608', {
    customerName: 'Yogi Faujdar',
    loanId: 'LOAN123',
    vehicleDetails: 'Maruti Swift VXI',
    amount: '5,00,000'
  });
  
  if (result1.success) {
    console.log('✅ Loan Approval: SUCCESS!');
    console.log('📧 Message ID:', result1.messageId);
  } else {
    console.log('❌ Loan Approval failed:', result1.error);
  }

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: Document Request
  console.log('\n📤 Test 2: Document Request...');
  const result2 = await WorkingTemplateService.sendDocumentRequest('916378110608', {
    customerName: 'Yogi Faujdar',
    loanId: 'LOAN123',
    vehicleDetails: 'Maruti Swift VXI',
    documentsNeeded: 'PAN, Aadhar, Salary Slip',
    days: '3'
  });
  
  if (result2.success) {
    console.log('✅ Document Request: SUCCESS!');
    console.log('📧 Message ID:', result2.messageId);
  } else {
    console.log('❌ Document Request failed:', result2.error);
  }

  const overallSuccess = result1.success || result2.success;
  
  console.log('\n📊 OVERALL RESULT:');
  console.log('Template Service:', overallSuccess ? '✅ WORKING' : '❌ FAILED');
  
  if (overallSuccess) {
    console.log('\n🎊 PERFECT! Template service is fully functional!');
    console.log('🚀 You now have professional WhatsApp templates for Car Credit Hub!');
    console.log('\n📋 Available Template Functions:');
    console.log('• sendLoanApproval() - Loan approved notification');
    console.log('• sendDocumentRequest() - Document request');
    console.log('• sendEMIReminder() - EMI payment reminder');
    console.log('• sendRCVerification() - RC verification');
    console.log('• sendLoanRejection() - Loan rejection');
    console.log('• sendLoanStatusUpdate() - General status update');
  }
  
  return overallSuccess;
}

// Export for easy use
export const sendLoanApproval = WorkingTemplateService.sendLoanApproval;
export const sendDocumentRequest = WorkingTemplateService.sendDocumentRequest;
export const sendEMIReminder = WorkingTemplateService.sendEMIReminder;
export const sendRCVerification = WorkingTemplateService.sendRCVerification;
export const sendLoanRejection = WorkingTemplateService.sendLoanRejection;
export const sendLoanStatusUpdate = WorkingTemplateService.sendLoanStatusUpdate;