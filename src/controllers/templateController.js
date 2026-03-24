import FinonestTemplateService from '../services/finonestTemplateService.js';
import BotBizWhatsAppAPI from '../integrations/whatsappApi.js';

// Send loan application received notification
export const sendLoanApplicationReceived = async (req, res) => {
  try {
    const { leadId, customerName, vehicleDetails, loanAmount } = req.body;

    if (!leadId || !customerName || !vehicleDetails || !loanAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendLoanApplicationReceived(
      leadId,
      customerName,
      vehicleDetails,
      loanAmount
    );

    res.json({ success: true, message: 'Loan application received notification sent' });
  } catch (error) {
    console.error('Send loan application received error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send document required notification
export const sendDocumentRequired = async (req, res) => {
  try {
    const { leadId, customerName, documentType, currentStatus } = req.body;

    if (!leadId || !customerName || !documentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendDocumentRequired(
      leadId,
      customerName,
      documentType,
      currentStatus
    );

    res.json({ success: true, message: 'Document required notification sent' });
  } catch (error) {
    console.error('Send document required error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send loan approved notification
export const sendLoanApproved = async (req, res) => {
  try {
    const { leadId, customerName, approvedAmount, vehicleDetails, emiAmount, tenure } = req.body;

    if (!leadId || !customerName || !approvedAmount || !vehicleDetails || !emiAmount || !tenure) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendLoanApproved(
      leadId,
      customerName,
      approvedAmount,
      vehicleDetails,
      emiAmount,
      tenure
    );

    res.json({ success: true, message: 'Loan approved notification sent' });
  } catch (error) {
    console.error('Send loan approved error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send loan disbursed notification
export const sendLoanDisbursed = async (req, res) => {
  try {
    const { leadId, customerName, disbursedAmount, accountNumber, disbursementDate } = req.body;

    if (!leadId || !customerName || !disbursedAmount || !accountNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendLoanDisbursed(
      leadId,
      customerName,
      disbursedAmount,
      accountNumber,
      disbursementDate || new Date().toLocaleDateString('en-IN')
    );

    res.json({ success: true, message: 'Loan disbursed notification sent' });
  } catch (error) {
    console.error('Send loan disbursed error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send EMI reminder
export const sendEMIReminder = async (req, res) => {
  try {
    const { leadId, customerName, emiAmount, dueDate, accountNumber } = req.body;

    if (!leadId || !customerName || !emiAmount || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendEMIReminder(
      leadId,
      customerName,
      emiAmount,
      dueDate,
      accountNumber || 'XXXX'
    );

    res.json({ success: true, message: 'EMI reminder sent' });
  } catch (error) {
    console.error('Send EMI reminder error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send status update
export const sendStatusUpdate = async (req, res) => {
  try {
    const { leadId, customerName, previousStatus, currentStatus, additionalInfo } = req.body;

    if (!leadId || !customerName || !previousStatus || !currentStatus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendStatusUpdate(
      leadId,
      customerName,
      previousStatus,
      currentStatus,
      new Date().toLocaleDateString('en-IN'),
      additionalInfo || ''
    );

    res.json({ success: true, message: 'Status update sent' });
  } catch (error) {
    console.error('Send status update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send welcome message to new customer
export const sendWelcomeCustomer = async (req, res) => {
  try {
    const { customerPhone, customerName } = req.body;

    if (!customerPhone || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendWelcomeCustomer(customerPhone, customerName);

    res.json({ success: true, message: 'Welcome message sent' });
  } catch (error) {
    console.error('Send welcome customer error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send loan rejected notification
export const sendLoanRejected = async (req, res) => {
  try {
    const { leadId, customerName, rejectionReason } = req.body;

    if (!leadId || !customerName || !rejectionReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendLoanRejected(leadId, customerName, rejectionReason);

    res.json({ success: true, message: 'Loan rejection notification sent' });
  } catch (error) {
    console.error('Send loan rejected error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { customerPhone, otpCode } = req.body;

    if (!customerPhone || !otpCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendOTP(customerPhone, otpCode);

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send loan offer
export const sendLoanOffer = async (req, res) => {
  try {
    const { customerPhone, customerName, maxLoanAmount, interestRate, validTill } = req.body;

    if (!customerPhone || !customerName || !maxLoanAmount || !interestRate || !validTill) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await FinonestTemplateService.sendLoanOffer(
      customerPhone,
      customerName,
      maxLoanAmount,
      interestRate,
      validTill
    );

    res.json({ success: true, message: 'Loan offer sent' });
  } catch (error) {
    console.error('Send loan offer error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send custom template
export const sendCustomTemplate = async (req, res) => {
  try {
    const { templateName, phoneNumber, parameters } = req.body;

    if (!templateName || !phoneNumber) {
      return res.status(400).json({ error: 'Template name and phone number are required' });
    }

    const result = await FinonestTemplateService.sendTemplate(
      templateName,
      phoneNumber,
      parameters || []
    );

    res.json({ success: true, message: 'Template sent', result });
  } catch (error) {
    console.error('Send custom template error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get available templates
export const getAvailableTemplates = async (req, res) => {
  try {
    const templates = await BotBizWhatsAppAPI.getTemplateList();
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Test template with sample data
export const testTemplate = async (req, res) => {
  try {
    const { templateName, testPhone } = req.body;

    if (!templateName || !testPhone) {
      return res.status(400).json({ error: 'Template name and test phone are required' });
    }

    // Sample data for testing different templates
    const sampleData = {
      loan_application_received: ['Test Customer', 'LOAN123', 'Maruti Swift', '500000'],
      document_required: ['Test Customer', 'LOAN123', 'PAN Card', 'Under Review'],
      loan_approved: ['Test Customer', 'LOAN123', '500000', 'Maruti Swift', '12500', '48'],
      loan_disbursed: ['Test Customer', 'LOAN123', '500000', '1234', new Date().toLocaleDateString('en-IN')],
      emi_reminder: ['Test Customer', 'LOAN123', '12500', '15-Jan-2024', '1234'],
      status_update: ['Test Customer', 'LOAN123', 'Under Review', 'Approved', new Date().toLocaleDateString('en-IN'), 'Congratulations!'],
      welcome_customer: ['Test Customer'],
      loan_rejected: ['Test Customer', 'LOAN123', 'Insufficient income documents'],
      loan_offer: ['Test Customer', '1000000', '8.5', '31-Dec-2024']
    };

    const parameters = sampleData[templateName] || [];
    
    const result = await FinonestTemplateService.sendTemplate(
      templateName,
      testPhone,
      parameters
    );

    res.json({ 
      success: true, 
      message: `Test template '${templateName}' sent to ${testPhone}`,
      parameters,
      result 
    });
  } catch (error) {
    console.error('Test template error:', error);
    res.status(500).json({ error: error.message });
  }
};