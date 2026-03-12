import db from '../config/database.js';

// Lead Status Constants
export const LEAD_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  LOGIN: 'LOGIN', 
  IN_PROCESS: 'IN_PROCESS',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CANCELLED: 'CANCELLED'
};

// Status Transitions Map
export const STATUS_TRANSITIONS = {
  [LEAD_STATUSES.SUBMITTED]: [LEAD_STATUSES.LOGIN, LEAD_STATUSES.REJECTED],
  [LEAD_STATUSES.LOGIN]: [LEAD_STATUSES.IN_PROCESS, LEAD_STATUSES.REJECTED],
  [LEAD_STATUSES.IN_PROCESS]: [LEAD_STATUSES.APPROVED, LEAD_STATUSES.REJECTED],
  [LEAD_STATUSES.APPROVED]: [LEAD_STATUSES.DISBURSED, LEAD_STATUSES.CANCELLED],
  [LEAD_STATUSES.REJECTED]: [], // Terminal
  [LEAD_STATUSES.DISBURSED]: [], // Terminal
  [LEAD_STATUSES.CANCELLED]: [] // Terminal
};

// Required Fields for Each Status
export const STATUS_REQUIRED_FIELDS = {
  [LEAD_STATUSES.SUBMITTED]: [],
  [LEAD_STATUSES.LOGIN]: [],
  [LEAD_STATUSES.IN_PROCESS]: [],
  [LEAD_STATUSES.REJECTED]: ['remarks'],
  [LEAD_STATUSES.APPROVED]: ['loanAmount', 'roi', 'tenure'],
  [LEAD_STATUSES.DISBURSED]: ['loanAmount', 'roi', 'tenure', 'loanAccountNumber', 'rcType', 'collectedBy'],
  [LEAD_STATUSES.CANCELLED]: ['remarks']
};

// Status Colors for UI
export const STATUS_COLORS = {
  [LEAD_STATUSES.SUBMITTED]: '#6B7280',
  [LEAD_STATUSES.LOGIN]: '#3B82F6', 
  [LEAD_STATUSES.IN_PROCESS]: '#F59E0B',
  [LEAD_STATUSES.APPROVED]: '#10B981',
  [LEAD_STATUSES.REJECTED]: '#EF4444',
  [LEAD_STATUSES.DISBURSED]: '#059669',
  [LEAD_STATUSES.CANCELLED]: '#6B7280'
};

// Validate Status Transition
export const validateStatusTransition = (currentStatus, newStatus) => {
  if (!currentStatus || !newStatus) {
    throw new Error('Current and new status are required');
  }
  
  if (currentStatus === newStatus) {
    throw new Error('New status must be different from current status');
  }
  
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }
  
  return true;
};

// Validate Required Fields
export const validateRequiredFields = (status, data) => {
  const requiredFields = STATUS_REQUIRED_FIELDS[status] || [];
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields for ${status}: ${missingFields.join(', ')}`);
  }
  
  return true;
};

// Update Lead Status
export const updateLeadStatus = async (leadId, newStatus, statusData, userId) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current lead data
    const leadResult = await client.query(
      'SELECT application_stage, stage_history FROM leads WHERE id = $1',
      [leadId]
    );
    
    if (leadResult.rows.length === 0) {
      throw new Error('Lead not found');
    }
    
    const currentStatus = leadResult.rows[0].application_stage || LEAD_STATUSES.SUBMITTED;
    const currentHistory = leadResult.rows[0].stage_history || [];
    
    // Validate transition
    validateStatusTransition(currentStatus, newStatus);
    
    // Validate required fields
    validateRequiredFields(newStatus, statusData);
    
    // Prepare stage data
    const stageData = {
      stage: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      ...statusData
    };
    
    // Add auto-generated fields based on status
    if (newStatus === LEAD_STATUSES.APPROVED) {
      stageData.approvedData = {
        ...statusData,
        approvedDate: new Date().toISOString()
      };
    } else if (newStatus === LEAD_STATUSES.DISBURSED) {
      stageData.disbursedData = {
        ...statusData,
        disbursedDate: new Date().toISOString()
      };
    } else if (newStatus === LEAD_STATUSES.CANCELLED) {
      stageData.cancelledData = {
        ...statusData,
        cancelledDate: new Date().toISOString()
      };
    } else if (newStatus === LEAD_STATUSES.REJECTED) {
      stageData.rejectedData = {
        ...statusData,
        rejectedDate: new Date().toISOString()
      };
    }
    
    // Update stage history
    const updatedHistory = [...currentHistory, stageData];
    
    // Update lead
    await client.query(
      'UPDATE leads SET application_stage = $1, stage_data = $2, stage_history = $3, updated_at = NOW() WHERE id = $4',
      [newStatus, JSON.stringify(stageData), JSON.stringify(updatedHistory), leadId]
    );
    
    // Create audit log
    await client.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, before_value, after_value) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'UPDATE_LEAD_STATUS',
        'leads',
        leadId,
        JSON.stringify({ status: currentStatus }),
        JSON.stringify({ status: newStatus, data: stageData })
      ]
    );
    
    // Handle special status logic
    await handleStatusSpecialLogic(client, leadId, newStatus, stageData, userId);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: `Lead status updated to ${newStatus}`,
      data: stageData
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Handle Special Status Logic
const handleStatusSpecialLogic = async (client, leadId, status, stageData, userId) => {
  switch (status) {
    case LEAD_STATUSES.APPROVED:
      // Schedule auto-cancellation after 30 days
      await scheduleAutoCancellation(client, leadId, stageData.approvedData.approvedDate);
      break;
      
    case LEAD_STATUSES.DISBURSED:
      // Create loan record
      await createLoanFromLead(client, leadId, stageData, userId);
      break;
      
    case LEAD_STATUSES.REJECTED:
    case LEAD_STATUSES.CANCELLED:
      // Cancel any scheduled auto-cancellation
      await cancelScheduledActions(client, leadId);
      break;
  }
};

// Schedule Auto-Cancellation
const scheduleAutoCancellation = async (client, leadId, approvedDate) => {
  // This would typically integrate with a job scheduler
  // For now, we'll just log it
  console.log(`Scheduled auto-cancellation for lead ${leadId} after 30 days from ${approvedDate}`);
};

// Create Loan from Lead
const createLoanFromLead = async (client, leadId, stageData, userId) => {
  // Get lead data
  const leadResult = await client.query(
    'SELECT * FROM leads WHERE id = $1',
    [leadId]
  );
  
  if (leadResult.rows.length === 0) return;
  
  const lead = leadResult.rows[0];
  const disbursedData = stageData.disbursedData;
  
  // Generate loan number
  const loanNumber = await generateLoanNumber(client);
  
  // Create loan record
  await client.query(`
    INSERT INTO loans (
      lead_id, loan_number, customer_name, phone, email, 
      loan_amount, interest_rate, tenure, bank_id, 
      status, disbursement_date, assigned_to, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `, [
    leadId,
    loanNumber,
    lead.customer_name,
    lead.phone,
    lead.email,
    disbursedData.loanAmount,
    disbursedData.roi,
    disbursedData.tenure,
    lead.financier_id,
    'active',
    new Date(),
    lead.assigned_to,
    userId
  ]);
};

// Generate Loan Number
const generateLoanNumber = async (client) => {
  const result = await client.query('SELECT COUNT(*) as count FROM loans');
  const count = parseInt(result.rows[0].count) + 1;
  return `LN${new Date().getFullYear()}${count.toString().padStart(6, '0')}`;
};

// Cancel Scheduled Actions
const cancelScheduledActions = async (client, leadId) => {
  console.log(`Cancelled scheduled actions for lead ${leadId}`);
};

// Get Lead Status History
export const getLeadStatusHistory = async (leadId) => {
  const result = await db.query(
    'SELECT stage_history FROM leads WHERE id = $1',
    [leadId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Lead not found');
  }
  
  return result.rows[0].stage_history || [];
};

// Check Auto-Cancellation Eligibility
export const checkAutoCancellationEligibility = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await db.query(`
    SELECT id, stage_data 
    FROM leads 
    WHERE application_stage = $1 
    AND (stage_data->>'approvedData'->>'approvedDate')::timestamp < $2
  `, [LEAD_STATUSES.APPROVED, thirtyDaysAgo.toISOString()]);
  
  return result.rows;
};

// Auto-Cancel Expired Approvals
export const autoCancelExpiredApprovals = async () => {
  const eligibleLeads = await checkAutoCancellationEligibility();
  const results = [];
  
  for (const lead of eligibleLeads) {
    try {
      const result = await updateLeadStatus(
        lead.id,
        LEAD_STATUSES.CANCELLED,
        {
          remarks: 'Auto-cancelled: Not disbursed within 30 days of approval'
        },
        'SYSTEM'
      );
      results.push({ leadId: lead.id, success: true, result });
    } catch (error) {
      results.push({ leadId: lead.id, success: false, error: error.message });
    }
  }
  
  return results;
};

// Get Status Statistics
export const getStatusStatistics = async (filters = {}) => {
  let query = `
    SELECT 
      application_stage,
      COUNT(*) as count,
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_days
    FROM leads 
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (filters.dateFrom) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(filters.dateFrom);
    paramIndex++;
  }
  
  if (filters.dateTo) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(filters.dateTo);
    paramIndex++;
  }
  
  if (filters.assignedTo) {
    query += ` AND assigned_to = $${paramIndex}`;
    params.push(filters.assignedTo);
    paramIndex++;
  }
  
  query += ' GROUP BY application_stage ORDER BY count DESC';
  
  const result = await db.query(query, params);
  return result.rows;
};

export default {
  LEAD_STATUSES,
  STATUS_TRANSITIONS,
  STATUS_REQUIRED_FIELDS,
  STATUS_COLORS,
  validateStatusTransition,
  validateRequiredFields,
  updateLeadStatus,
  getLeadStatusHistory,
  autoCancelExpiredApprovals,
  getStatusStatistics
};