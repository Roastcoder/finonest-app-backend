import WhatsAppAPI from '../integrations/whatsappApi.js';
import db from '../config/database.js';

class WhatsAppNotificationService {
  
  // Get user's WhatsApp number from database
  async getUserWhatsAppNumber(userId) {
    try {
      const result = await db.query('SELECT phone FROM users WHERE id = $1', [userId]);
      return result.rows[0]?.phone;
    } catch (error) {
      console.error('Error fetching user phone:', error);
      return null;
    }
  }

  // Get customer's WhatsApp number from lead/loan
  async getCustomerWhatsAppNumber(leadId) {
    try {
      const result = await db.query('SELECT customer_phone FROM leads WHERE id = $1', [leadId]);
      return result.rows[0]?.customer_phone;
    } catch (error) {
      console.error('Error fetching customer phone:', error);
      return null;
    }
  }

  // Send loan application confirmation
  async sendLoanApplicationConfirmation(leadId) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `🎉 Your loan application has been received successfully! 
      
Application ID: ${leadId}
Status: Under Review

We'll keep you updated on the progress. Thank you for choosing Finonest!`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp loan confirmation error:', error);
    }
  }

  // Send document request
  async sendDocumentRequest(leadId, documentType) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `📄 Document Required
      
Application ID: ${leadId}
Required Document: ${documentType}

Please upload the required document through our portal or contact your relationship manager.`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp document request error:', error);
    }
  }

  // Send loan approval notification
  async sendLoanApproval(leadId, amount) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `🎊 Congratulations! Your loan has been APPROVED!
      
Application ID: ${leadId}
Approved Amount: ₹${amount.toLocaleString()}

Our team will contact you shortly for the next steps.`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp approval error:', error);
    }
  }

  // Send loan disbursement notification
  async sendDisbursementNotification(leadId, amount, accountNumber) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `💰 Loan Disbursed Successfully!
      
Application ID: ${leadId}
Amount: ₹${amount.toLocaleString()}
Account: ***${accountNumber.slice(-4)}

The amount has been credited to your account. Thank you for choosing Finonest!`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp disbursement error:', error);
    }
  }

  // Send loan rejection notification
  async sendLoanRejection(leadId, reason) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `❌ Loan Application Update
      
Application ID: ${leadId}
Status: Not Approved
Reason: ${reason}

You can reapply after addressing the mentioned concerns. Contact us for assistance.`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp rejection error:', error);
    }
  }

  // Send staff notification for new lead
  async sendStaffNewLeadNotification(userId, leadId, customerName) {
    try {
      const staffPhone = await this.getUserWhatsAppNumber(userId);
      if (!staffPhone) return;

      const message = `🔔 New Lead Assigned
      
Lead ID: ${leadId}
Customer: ${customerName}
Status: New

Please review and take necessary action.`;

      await WhatsAppAPI.sendTextMessage(staffPhone, message);
    } catch (error) {
      console.error('WhatsApp staff notification error:', error);
    }
  }

  // Send payment reminder
  async sendPaymentReminder(leadId, amount, dueDate) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `💳 Payment Reminder
      
Loan ID: ${leadId}
Amount Due: ₹${amount.toLocaleString()}
Due Date: ${dueDate}

Please make the payment to avoid late charges.`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp payment reminder error:', error);
    }
  }

  // Send stage change notification
  async sendStageChangeNotification(leadId, newStage) {
    try {
      const customerPhone = await this.getCustomerWhatsAppNumber(leadId);
      if (!customerPhone) return;

      const message = `📊 Application Status Update
      
Application ID: ${leadId}
Current Status: ${newStage}

Your application is progressing. We'll keep you updated!`;

      await WhatsAppAPI.sendTextMessage(customerPhone, message);
    } catch (error) {
      console.error('WhatsApp stage change error:', error);
    }
  }
}

export default new WhatsAppNotificationService();