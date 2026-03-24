import BotBizWhatsAppAPI from '../integrations/whatsappApi.js';
import db from '../config/database.js';

class FinonestTemplateService {
  
  // Send loan application received template
  async sendLoanApplicationReceived(leadId, customerName, vehicleDetails, loanAmount) {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'loan_application_received',
        [
          customerName,
          leadId,
          vehicleDetails,
          loanAmount.toLocaleString()
        ]
      );
    } catch (error) {
      console.error('Template send error (loan_application_received):', error);
    }
  }

  // Send document required template
  async sendDocumentRequired(leadId, customerName, documentType, currentStatus = 'Under Review') {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'document_required',
        [
          customerName,
          leadId,
          documentType,
          currentStatus
        ]
      );
    } catch (error) {
      console.error('Template send error (document_required):', error);
    }
  }

  // Send loan approved template
  async sendLoanApproved(leadId, customerName, approvedAmount, vehicleDetails, emiAmount, tenure) {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'loan_approved',
        [
          customerName,
          leadId,
          approvedAmount.toLocaleString(),
          vehicleDetails,
          emiAmount.toLocaleString(),
          tenure.toString()
        ]
      );
    } catch (error) {
      console.error('Template send error (loan_approved):', error);
    }
  }

  // Send loan disbursed template
  async sendLoanDisbursed(leadId, customerName, disbursedAmount, accountNumber, disbursementDate) {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'loan_disbursed',
        [
          customerName,
          leadId,
          disbursedAmount.toLocaleString(),
          accountNumber.slice(-4),
          disbursementDate
        ]
      );
    } catch (error) {
      console.error('Template send error (loan_disbursed):', error);
    }
  }

  // Send EMI reminder template
  async sendEMIReminder(leadId, customerName, emiAmount, dueDate, accountNumber) {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'emi_reminder',
        [
          customerName,
          leadId,
          emiAmount.toLocaleString(),
          dueDate,
          accountNumber.slice(-4)
        ]
      );
    } catch (error) {
      console.error('Template send error (emi_reminder):', error);
    }
  }

  // Send status update template
  async sendStatusUpdate(leadId, customerName, previousStatus, currentStatus, updateDate, additionalInfo = '') {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'status_update',
        [
          customerName,
          leadId,
          previousStatus,
          currentStatus,
          updateDate,
          additionalInfo
        ]
      );
    } catch (error) {
      console.error('Template send error (status_update):', error);
    }
  }

  // Send welcome customer template
  async sendWelcomeCustomer(customerPhone, customerName) {
    try {
      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'welcome_customer',
        [customerName]
      );
    } catch (error) {
      console.error('Template send error (welcome_customer):', error);
    }
  }

  // Send loan rejected template
  async sendLoanRejected(leadId, customerName, rejectionReason) {
    try {
      const customerPhone = await this.getCustomerPhone(leadId);
      if (!customerPhone) return;

      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'loan_rejected',
        [
          customerName,
          leadId,
          rejectionReason
        ]
      );
    } catch (error) {
      console.error('Template send error (loan_rejected):', error);
    }
  }

  // Send OTP template
  async sendOTP(customerPhone, otpCode) {
    try {
      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'finonest_otp',
        [otpCode]
      );
    } catch (error) {
      console.error('Template send error (finonest_otp):', error);
    }
  }

  // Send loan offer template
  async sendLoanOffer(customerPhone, customerName, maxLoanAmount, interestRate, validTill) {
    try {
      await BotBizWhatsAppAPI.sendTemplateMessage(
        customerPhone,
        'loan_offer',
        [
          customerName,
          maxLoanAmount.toLocaleString(),
          interestRate.toString(),
          validTill
        ]
      );
    } catch (error) {
      console.error('Template send error (loan_offer):', error);
    }
  }

  // Helper method to get customer phone from lead ID
  async getCustomerPhone(leadId) {
    try {
      const result = await db.query('SELECT customer_phone, mobile FROM leads WHERE id = $1', [leadId]);
      return result.rows[0]?.customer_phone || result.rows[0]?.mobile;
    } catch (error) {
      console.error('Error fetching customer phone:', error);
      return null;
    }
  }

  // Send template with automatic phone number formatting
  async sendTemplate(templateName, phoneNumber, parameters = []) {
    try {
      // Format phone number (ensure it starts with country code)
      let formattedPhone = phoneNumber;
      if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }
      
      const result = await BotBizWhatsAppAPI.sendTemplateMessage(
        formattedPhone,
        templateName,
        parameters
      );
      
      console.log(`✅ Template '${templateName}' sent to ${formattedPhone}`);
      return result;
    } catch (error) {
      console.error(`❌ Template '${templateName}' failed for ${phoneNumber}:`, error);
      throw error;
    }
  }
}

export default new FinonestTemplateService();