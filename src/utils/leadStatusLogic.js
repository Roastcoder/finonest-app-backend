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

// Update Lead Status - Only for converting to loan
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
    
    // Only allow SUBMITTED -> DISBURSED transition (convert to loan)
    if (currentStatus !== LEAD_STATUSES.SUBMITTED || newStatus !== LEAD_STATUSES.DISBURSED) {
      throw new Error('Only conversion from SUBMITTED to DISBURSED (loan) is allowed');
    }
    
    // Validate required fields for loan conversion
    validateRequiredFields(newStatus, statusData);
    
    const currentHistory = leadResult.rows[0].stage_history || [];
    
    // Prepare stage data for loan conversion
    const stageData = {
      stage: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      disbursedData: {
        ...statusData,
        disbursedDate: new Date().toISOString()
      }
    };
    
    // Update stage history
    const updatedHistory = [...currentHistory, stageData];
    
    // Update lead status to DISBURSED
    await client.query(
      'UPDATE leads SET application_stage = $1, stage_data = $2, stage_history = $3, updated_at = NOW() WHERE id = $4',
      [newStatus, stageData, updatedHistory, leadId]
    );
    
    // Create audit log (optional - table may not exist)
    try {
      await client.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, before_value, after_value) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          userId,
          'CONVERT_LEAD_TO_LOAN',
          'leads',
          leadId,
          JSON.stringify({ status: currentStatus }),
          JSON.stringify({ status: newStatus, data: stageData })
        ]
      );
    } catch (auditError) {
      console.log(`Audit log: Lead ${leadId} converted from ${currentStatus} to ${newStatus}`);
    }
    
    // Convert to loan and mark as converted
    await createLoanFromLead(client, leadId, stageData, userId);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Lead successfully converted to loan',
      data: stageData
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  
  // Mark lead as converted and update status to DISBURSED
  const updateResult = await client.query(
    'UPDATE leads SET converted_to_loan = true, loan_created_at = NOW(), application_stage = $1 WHERE id = $2 RETURNING id, converted_to_loan',
    ['DISBURSED', leadId]
  );
  
  console.log(`Created loan ${loanNumber} from lead ${leadId}. Lead status: DISBURSED, converted_to_loan:`, updateResult.rows[0]);
};

// Generate Loan Number
const generateLoanNumber = async (client) => {
  const result = await client.query('SELECT COUNT(*) as count FROM loans');
  const count = parseInt(result.rows[0].count) + 1;
  return `LN${new Date().getFullYear()}${count.toString().padStart(6, '0')}`;
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

// Get Status Statistics - simplified for SUBMITTED and DISBURSED only
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
  getStatusStatistics
};