import db from '../config/database.js';

// Boilerplate for external notifications
const sendEmail = async (userId, title, message) => {
  // TODO: Configure Nodemailer / SendGrid here
  console.log(`[EMAIL] To User ${userId}: ${title} - ${message}`);
};

const sendSMS = async (userId, message) => {
  // TODO: Configure Twilio / MSG91 here
  console.log(`[SMS/WhatsApp] To User ${userId}: ${message}`);
};

export const createNotification = async (userId, type, title, message, relatedId = null, relatedType = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id, related_type, delivery_channels)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, type, title, message, relatedId, relatedType, JSON.stringify(['in_app'])]
    );

    // Trigger external channels
    await sendEmail(userId, title, message);
    await sendSMS(userId, message);

  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

export const notifyLeadCreated = async (leadId, assignedTo) => {
  await createNotification(assignedTo, 'lead_created', 'New Lead Assigned', 'A new lead has been assigned to you', leadId, 'lead');
};

export const notifyStageChange = async (leadId, userId, fromStage, toStage) => {
  await createNotification(userId, 'stage_change', 'Lead Stage Updated', `Lead moved from ${fromStage} to ${toStage}`, leadId, 'lead');
};

export const notifyDisbursement = async (leadId, userId, amount) => {
  await createNotification(userId, 'disbursement', 'Loan Disbursed', `Loan of ₹${amount} has been disbursed`, leadId, 'lead');
};

export const notifyRejection = async (leadId, userId) => {
  await createNotification(userId, 'rejection', 'Application Rejected', 'Your loan application has been rejected', leadId, 'lead');
};

export const notifyPaymentRequest = async (userId, amount) => {
  await createNotification(userId, 'payment_request', 'Payment Request', `Payment request of ₹${amount} submitted`, null, 'payment');
};

export const notifyExpenseSubmission = async (userId, expenseId) => {
  await createNotification(userId, 'expense_submission', 'Expense Submitted', 'New expense submitted for approval', expenseId, 'expense');
};

export const notifyPDDOverdue = async (userId, leadId, days) => {
  await createNotification(userId, 'pdd_overdue', 'PDD Overdue', `Lead is overdue by ${days} days`, leadId, 'lead');
};
