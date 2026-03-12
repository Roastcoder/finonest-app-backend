import db from '../config/database.js';

// Application Stages Constants
export const APPLICATION_STAGES = {
  SUBMITTED: 'SUBMITTED',
  LOGIN: 'LOGIN',
  IN_PROCESS: 'IN_PROCESS',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  DISBURSED: 'DISBURSED',
  CANCELLED: 'CANCELLED'
};

// RC Types
export const RC_TYPES = {
  PHYSICAL_RC: 'PHYSICAL_RC',
  DIGITAL_RC: 'DIGITAL_RC'
};

// Collection Types
export const COLLECTION_TYPES = {
  SELF: 'SELF',
  RTO_AGENT: 'RTO_AGENT',
  BANKER: 'BANKER'
};

// Stage Transitions Map
export const STAGE_TRANSITIONS = {
  [APPLICATION_STAGES.SUBMITTED]: [APPLICATION_STAGES.LOGIN, APPLICATION_STAGES.REJECTED],
  [APPLICATION_STAGES.LOGIN]: [APPLICATION_STAGES.IN_PROCESS, APPLICATION_STAGES.REJECTED],
  [APPLICATION_STAGES.IN_PROCESS]: [APPLICATION_STAGES.APPROVED, APPLICATION_STAGES.REJECTED],
  [APPLICATION_STAGES.APPROVED]: [APPLICATION_STAGES.DISBURSED, APPLICATION_STAGES.CANCELLED],
  [APPLICATION_STAGES.REJECTED]: [], // Terminal
  [APPLICATION_STAGES.DISBURSED]: [], // Terminal
  [APPLICATION_STAGES.CANCELLED]: [] // Terminal
};

// Required Fields for Each Stage
export const STAGE_REQUIRED_FIELDS = {
  [APPLICATION_STAGES.SUBMITTED]: [],
  [APPLICATION_STAGES.LOGIN]: [], // appScore and creditScore are optional
  [APPLICATION_STAGES.IN_PROCESS]: [], // tags are optional
  [APPLICATION_STAGES.REJECTED]: ['remarks'],
  [APPLICATION_STAGES.APPROVED]: ['loanAmount', 'roi', 'tenure'],
  [APPLICATION_STAGES.DISBURSED]: [
    'loanAmount', 'roi', 'tenure', 'loanAccountNumber', 
    'rcType', 'collectedBy'
  ],
  [APPLICATION_STAGES.CANCELLED]: ['remarks']
};

// Conditional Required Fields
export const CONDITIONAL_REQUIRED_FIELDS = {
  [APPLICATION_STAGES.DISBURSED]: {
    [COLLECTION_TYPES.RTO_AGENT]: ['agentName', 'agentMobile'],
    [COLLECTION_TYPES.BANKER]: ['bankerName', 'bankerMobile']
  }
};

// Stage Colors for UI
export const STAGE_COLORS = {
  [APPLICATION_STAGES.SUBMITTED]: '#6B7280',
  [APPLICATION_STAGES.LOGIN]: '#3B82F6',
  [APPLICATION_STAGES.IN_PROCESS]: '#F59E0B',
  [APPLICATION_STAGES.APPROVED]: '#10B981',
  [APPLICATION_STAGES.REJECTED]: '#EF4444',
  [APPLICATION_STAGES.DISBURSED]: '#059669',
  [APPLICATION_STAGES.CANCELLED]: '#6B7280'
};

// Stage Labels
export const STAGE_LABELS = {
  [APPLICATION_STAGES.SUBMITTED]: 'Submitted',
  [APPLICATION_STAGES.LOGIN]: 'Login',
  [APPLICATION_STAGES.IN_PROCESS]: 'In Process',
  [APPLICATION_STAGES.APPROVED]: 'Approved',
  [APPLICATION_STAGES.REJECTED]: 'Rejected',
  [APPLICATION_STAGES.DISBURSED]: 'Disbursed',
  [APPLICATION_STAGES.CANCELLED]: 'Cancelled'
};

// Validate Stage Transition
export const validateStageTransition = (currentStage, newStage) => {
  if (!currentStage || !newStage) {
    throw new Error('Current and new stage are required');
  }
  
  if (currentStage === newStage) {
    throw new Error('New stage must be different from current stage');
  }
  
  const allowedTransitions = STAGE_TRANSITIONS[currentStage];
  if (!allowedTransitions || !allowedTransitions.includes(newStage)) {
    throw new Error(`Invalid transition from ${currentStage} to ${newStage}`);
  }
  
  return true;
};

// Validate Required Fields
export const validateRequiredFields = (stage, data) => {
  const requiredFields = STAGE_REQUIRED_FIELDS[stage] || [];
  const missingFields = [];
  
  // Check basic required fields
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  // Check conditional required fields
  if (stage === APPLICATION_STAGES.DISBURSED && data.collectedBy) {
    const conditionalFields = CONDITIONAL_REQUIRED_FIELDS[stage][data.collectedBy] || [];
    for (const field of conditionalFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missingFields.push(field);
      }
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields for ${stage}: ${missingFields.join(', ')}`);
  }
  
  return true;
};

// Validate Field Values
export const validateFieldValues = (stage, data) => {
  // Validate RC Type
  if (data.rcType && !Object.values(RC_TYPES).includes(data.rcType)) {
    throw new Error(`Invalid RC Type: ${data.rcType}`);
  }
  
  // Validate Collection Type
  if (data.collectedBy && !Object.values(COLLECTION_TYPES).includes(data.collectedBy)) {
    throw new Error(`Invalid Collection Type: ${data.collectedBy}`);
  }
  
  // Validate numeric fields
  if (data.loanAmount && (isNaN(data.loanAmount) || data.loanAmount <= 0)) {
    throw new Error('Loan amount must be a positive number');
  }
  
  if (data.roi && (isNaN(data.roi) || data.roi <= 0 || data.roi > 100)) {
    throw new Error('ROI must be a number between 0 and 100');
  }
  
  if (data.tenure && (isNaN(data.tenure) || data.tenure <= 0)) {
    throw new Error('Tenure must be a positive number');
  }
  
  if (data.appScore && (isNaN(data.appScore) || data.appScore < 0 || data.appScore > 1000)) {
    throw new Error('App Score must be a number between 0 and 1000');
  }
  
  if (data.creditScore && (isNaN(data.creditScore) || data.creditScore < 300 || data.creditScore > 900)) {
    throw new Error('Credit Score must be a number between 300 and 900');
  }
  
  // Validate mobile numbers
  const mobileFields = ['agentMobile', 'bankerMobile'];
  for (const field of mobileFields) {
    if (data[field] && !/^[6-9]\d{9}$/.test(data[field])) {
      throw new Error(`${field} must be a valid 10-digit mobile number`);
    }
  }
  
  return true;
};

// Generic function to update application stage (works for both leads and loans)
export const updateApplicationStage = async (recordId, newStage, stageData, userId, tableType = 'leads') => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const tableName = tableType === 'loans' ? 'loans' : 'leads';
    const historyTableName = tableType === 'loans' ? 'loan_application_stage_history' : 'lead_stage_history';
    const foreignKeyName = tableType === 'loans' ? 'loan_id' : 'lead_id';
    
    // Get current record data
    const recordResult = await client.query(
      `SELECT application_stage, stage_history, stage_data FROM ${tableName} WHERE id = $1`,
      [recordId]
    );
    
    if (recordResult.rows.length === 0) {
      throw new Error(`${tableType.slice(0, -1)} not found`);
    }
    
    const currentStage = recordResult.rows[0].application_stage || APPLICATION_STAGES.SUBMITTED;
    const currentHistory = recordResult.rows[0].stage_history || [];
    
    // Validate transition
    validateStageTransition(currentStage, newStage);
    
    // Validate required fields
    validateRequiredFields(newStage, stageData);
    
    // Validate field values
    validateFieldValues(newStage, stageData);
    
    // Prepare stage data with timestamps
    const updatedStageData = {
      stage: newStage,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      ...prepareStageSpecificData(newStage, stageData)
    };
    
    // Update stage history
    const updatedHistory = [...currentHistory, updatedStageData];
    
    // Update record
    await client.query(
      `UPDATE ${tableName} SET application_stage = $1, stage_data = $2, stage_history = $3, stage_changed_at = NOW(), updated_at = NOW() WHERE id = $4`,
      [newStage, JSON.stringify(updatedStageData), JSON.stringify(updatedHistory), recordId]
    );
    
    // Update specific stage fields in the table
    await updateStageSpecificFields(client, tableName, recordId, newStage, stageData);
    
    // Create audit log
    await client.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, before_value, after_value) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'UPDATE_APPLICATION_STAGE',
        tableName,
        recordId,
        JSON.stringify({ stage: currentStage }),
        JSON.stringify({ stage: newStage, data: updatedStageData })
      ]
    ).catch(() => {
      // If audit_logs table doesn't exist, just log
      console.log(`Audit log: ${tableName} ${recordId} stage updated from ${currentStage} to ${newStage}`);
    });
    
    // Create stage history record
    await client.query(
      `INSERT INTO ${historyTableName} (${foreignKeyName}, from_stage, to_stage, changed_by, stage_data) VALUES ($1, $2, $3, $4, $5)`,
      [recordId, currentStage, newStage, userId, JSON.stringify(updatedStageData)]
    ).catch(() => {
      // If history table doesn't exist, just log
      console.log(`Stage history: ${tableName} ${recordId} moved from ${currentStage} to ${newStage}`);
    });
    
    // Handle stage-specific logic
    await handleStageSpecificLogic(client, recordId, newStage, updatedStageData, userId, tableType);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: `${tableType.slice(0, -1)} application stage updated to ${newStage}`,
      data: updatedStageData
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Update stage-specific fields in the table
const updateStageSpecificFields = async (client, tableName, recordId, stage, data) => {
  const updates = [];
  const values = [];
  let paramIndex = 1;
  
  switch (stage) {
    case APPLICATION_STAGES.LOGIN:
      if (data.appScore !== undefined) {
        updates.push(`app_score = $${paramIndex++}`);
        values.push(parseFloat(data.appScore) || null);
      }
      if (data.creditScore !== undefined) {
        updates.push(`credit_score = $${paramIndex++}`);
        values.push(parseInt(data.creditScore) || null);
      }
      break;
      
    case APPLICATION_STAGES.IN_PROCESS:
      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(Array.isArray(data.tags) ? data.tags : []);
      }
      break;
      
    case APPLICATION_STAGES.REJECTED:
      if (data.remarks) {
        updates.push(`rejection_remarks = $${paramIndex++}`);
        values.push(data.remarks);
      }
      break;
      
    case APPLICATION_STAGES.APPROVED:
      if (data.loanAmount) {
        updates.push(`loan_amount = $${paramIndex++}`);
        values.push(parseFloat(data.loanAmount));
      }
      if (data.roi) {
        updates.push(`roi = $${paramIndex++}`);
        values.push(parseFloat(data.roi));
      }
      if (data.tenure) {
        updates.push(`tenure = $${paramIndex++}`);
        values.push(parseInt(data.tenure));
      }
      if (data.remarks) {
        updates.push(`approval_remarks = $${paramIndex++}`);
        values.push(data.remarks);
      }
      break;
      
    case APPLICATION_STAGES.DISBURSED:
      if (data.loanAmount) {
        updates.push(`loan_amount = $${paramIndex++}`);
        values.push(parseFloat(data.loanAmount));
      }
      if (data.roi) {
        updates.push(`roi = $${paramIndex++}`);
        values.push(parseFloat(data.roi));
      }
      if (data.tenure) {
        updates.push(`tenure = $${paramIndex++}`);
        values.push(parseInt(data.tenure));
      }
      if (data.loanAccountNumber) {
        updates.push(`loan_account_number = $${paramIndex++}`);
        values.push(data.loanAccountNumber);
      }
      if (data.rcType) {
        updates.push(`rc_type = $${paramIndex++}`);
        values.push(data.rcType);
      }
      if (data.collectedBy) {
        updates.push(`rc_collected_by = $${paramIndex++}`);
        values.push(data.collectedBy);
      }
      if (data.agentName) {
        updates.push(`rto_agent_name_rc = $${paramIndex++}`);
        values.push(data.agentName);
      }
      if (data.agentMobile) {
        updates.push(`rto_agent_mobile = $${paramIndex++}`);
        values.push(data.agentMobile);
      }
      if (data.bankerName) {
        updates.push(`banker_name = $${paramIndex++}`);
        values.push(data.bankerName);
      }
      if (data.bankerMobile) {
        updates.push(`banker_mobile = $${paramIndex++}`);
        values.push(data.bankerMobile);
      }
      updates.push(`disbursement_date = $${paramIndex++}`);
      values.push(new Date());
      break;
      
    case APPLICATION_STAGES.CANCELLED:
      if (data.remarks) {
        updates.push(`cancellation_remarks = $${paramIndex++}`);
        values.push(data.remarks);
      }
      break;
  }
  
  if (updates.length > 0) {
    values.push(recordId);
    await client.query(
      `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }
};

// Prepare Stage Specific Data
const prepareStageSpecificData = (stage, data) => {
  const stageData = { ...data };
  
  switch (stage) {
    case APPLICATION_STAGES.LOGIN:
      return {
        loginData: {
          appScore: data.appScore || null,
          creditScore: data.creditScore || null,
          loginDate: new Date().toISOString()
        }
      };
      
    case APPLICATION_STAGES.IN_PROCESS:
      return {
        inProcessData: {
          tags: data.tags || [],
          processStartDate: new Date().toISOString()
        }
      };
      
    case APPLICATION_STAGES.REJECTED:
      return {
        rejectedData: {
          remarks: data.remarks,
          rejectedDate: new Date().toISOString()
        }
      };
      
    case APPLICATION_STAGES.APPROVED:
      return {
        approvedData: {
          loanAmount: parseFloat(data.loanAmount),
          roi: parseFloat(data.roi),
          tenure: parseInt(data.tenure),
          approvedDate: new Date().toISOString()
        }
      };
      
    case APPLICATION_STAGES.DISBURSED:
      const disbursedData = {
        loanAmount: parseFloat(data.loanAmount),
        roi: parseFloat(data.roi),
        tenure: parseInt(data.tenure),
        loanAccountNumber: data.loanAccountNumber,
        vehicleRcStatus: {
          rcType: data.rcType,
          collectedBy: data.collectedBy
        },
        disbursedDate: new Date().toISOString()
      };
      
      // Add collector details based on type
      if (data.collectedBy === COLLECTION_TYPES.RTO_AGENT) {
        disbursedData.vehicleRcStatus.agentDetails = {
          name: data.agentName,
          mobile: data.agentMobile
        };
      } else if (data.collectedBy === COLLECTION_TYPES.BANKER) {
        disbursedData.vehicleRcStatus.bankerDetails = {
          name: data.bankerName,
          mobile: data.bankerMobile
        };
      }
      
      return { disbursedData };
      
    case APPLICATION_STAGES.CANCELLED:
      return {
        cancelledData: {
          remarks: data.remarks,
          cancelledDate: new Date().toISOString()
        }
      };
      
    default:
      return stageData;
  }
};

// Handle Stage Specific Logic
const handleStageSpecificLogic = async (client, recordId, stage, stageData, userId, tableType) => {
  switch (stage) {
    case APPLICATION_STAGES.APPROVED:
      // Schedule auto-cancellation after 30 days
      await scheduleAutoCancellation(client, recordId, stageData.approvedData.approvedDate, tableType);
      break;
      
    case APPLICATION_STAGES.DISBURSED:
      // Cancel auto-cancellation and create loan if from leads
      await cancelScheduledAutoCancellation(client, recordId, tableType);
      if (tableType === 'leads') {
        await createLoanFromLead(client, recordId, stageData, userId);
      }
      break;
      
    case APPLICATION_STAGES.REJECTED:
    case APPLICATION_STAGES.CANCELLED:
      // Cancel any scheduled auto-cancellation
      await cancelScheduledAutoCancellation(client, recordId, tableType);
      break;
  }
};

// Schedule Auto-Cancellation
const scheduleAutoCancellation = async (client, recordId, approvedDate, tableType) => {
  try {
    await client.query(
      'INSERT INTO scheduled_jobs (job_type, reference_id, scheduled_date, status, metadata) VALUES ($1, $2, $3, $4, $5)',
      [
        'AUTO_CANCEL_APPROVAL',
        recordId,
        new Date(new Date(approvedDate).getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from approval
        'PENDING',
        JSON.stringify({ tableType })
      ]
    );
  } catch (error) {
    console.log(`Scheduled auto-cancellation for ${tableType} ${recordId} after 30 days from ${approvedDate}`);
  }
};

// Cancel Scheduled Auto-Cancellation
const cancelScheduledAutoCancellation = async (client, recordId, tableType) => {
  try {
    await client.query(
      'UPDATE scheduled_jobs SET status = $1 WHERE job_type = $2 AND reference_id = $3 AND status = $4 AND metadata->\'tableType\' = $5',
      ['CANCELLED', 'AUTO_CANCEL_APPROVAL', recordId, 'PENDING', `"${tableType}"`]
    );
  } catch (error) {
    console.log(`Cancelled scheduled auto-cancellation for ${tableType} ${recordId}`);
  }
};

// Create Loan from Lead
const createLoanFromLead = async (client, leadId, stageData, userId) => {
  try {
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
        status, disbursement_date, assigned_to, created_by,
        application_stage, roi, loan_account_number,
        rc_type, rc_collected_by, rto_agent_name_rc, rto_agent_mobile,
        banker_name, banker_mobile
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
      userId,
      APPLICATION_STAGES.DISBURSED,
      disbursedData.roi,
      disbursedData.loanAccountNumber,
      disbursedData.vehicleRcStatus.rcType,
      disbursedData.vehicleRcStatus.collectedBy,
      disbursedData.vehicleRcStatus.agentDetails?.name || null,
      disbursedData.vehicleRcStatus.agentDetails?.mobile || null,
      disbursedData.vehicleRcStatus.bankerDetails?.name || null,
      disbursedData.vehicleRcStatus.bankerDetails?.mobile || null
    ]);
    
    console.log(`Created loan ${loanNumber} from lead ${leadId}`);
  } catch (error) {
    console.error('Error creating loan from lead:', error);
  }
};

// Generate Loan Number
const generateLoanNumber = async (client) => {
  const result = await client.query('SELECT COUNT(*) as count FROM loans');
  const count = parseInt(result.rows[0].count) + 1;
  return `LN${new Date().getFullYear()}${count.toString().padStart(6, '0')}`;
};

// Wrapper functions for backward compatibility
export const updateLeadApplicationStage = async (leadId, newStage, stageData, userId) => {
  return updateApplicationStage(leadId, newStage, stageData, userId, 'leads');
};

export const updateLoanApplicationStage = async (loanId, newStage, stageData, userId) => {
  return updateApplicationStage(loanId, newStage, stageData, userId, 'loans');
};

// Get Stage History (works for both leads and loans)
export const getStageHistory = async (recordId, tableType = 'leads') => {
  const tableName = tableType === 'loans' ? 'loans' : 'leads';
  
  const result = await db.query(
    `SELECT stage_history FROM ${tableName} WHERE id = $1`,
    [recordId]
  );
  
  if (result.rows.length === 0) {
    throw new Error(`${tableType.slice(0, -1)} not found`);
  }
  
  return result.rows[0].stage_history || [];
};

// Backward compatibility functions
export const getLeadStageHistory = async (leadId) => {
  return getStageHistory(leadId, 'leads');
};

export const getLoanStageHistory = async (loanId) => {
  return getStageHistory(loanId, 'loans');
};

// Auto-Cancel Expired Approvals (works for both leads and loans)
export const autoCancelExpiredApprovals = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const results = [];
  
  // Check leads
  try {
    const leadsResult = await db.query(`
      SELECT id, stage_data 
      FROM leads 
      WHERE application_stage = $1 
      AND (stage_data->>'approvedData'->>'approvedDate')::timestamp < $2
    `, [APPLICATION_STAGES.APPROVED, thirtyDaysAgo.toISOString()]);
    
    for (const lead of leadsResult.rows) {
      try {
        const result = await updateLeadApplicationStage(
          lead.id,
          APPLICATION_STAGES.CANCELLED,
          {
            remarks: 'Auto-cancelled: Not disbursed within 30 days of approval'
          },
          'SYSTEM'
        );
        results.push({ type: 'lead', id: lead.id, success: true, result });
      } catch (error) {
        results.push({ type: 'lead', id: lead.id, success: false, error: error.message });
      }
    }
  } catch (error) {
    console.error('Error checking leads for auto-cancellation:', error);
  }
  
  // Check loans
  try {
    const loansResult = await db.query(`
      SELECT id, stage_data 
      FROM loans 
      WHERE application_stage = $1 
      AND (stage_data->>'approvedData'->>'approvedDate')::timestamp < $2
    `, [APPLICATION_STAGES.APPROVED, thirtyDaysAgo.toISOString()]);
    
    for (const loan of loansResult.rows) {
      try {
        const result = await updateLoanApplicationStage(
          loan.id,
          APPLICATION_STAGES.CANCELLED,
          {
            remarks: 'Auto-cancelled: Not disbursed within 30 days of approval'
          },
          'SYSTEM'
        );
        results.push({ type: 'loan', id: loan.id, success: true, result });
      } catch (error) {
        results.push({ type: 'loan', id: loan.id, success: false, error: error.message });
      }
    }
  } catch (error) {
    console.error('Error checking loans for auto-cancellation:', error);
  }
  
  return results;
};

// Get Stage Statistics (works for both leads and loans)
export const getStageStatistics = async (filters = {}, tableType = 'both') => {
  const results = {};
  
  if (tableType === 'leads' || tableType === 'both') {
    results.leads = await getTableStageStatistics('leads', filters);
  }
  
  if (tableType === 'loans' || tableType === 'both') {
    results.loans = await getTableStageStatistics('loans', filters);
  }
  
  return tableType === 'both' ? results : results[tableType];
};

const getTableStageStatistics = async (tableName, filters) => {
  let query = `
    SELECT 
      application_stage,
      COUNT(*) as count,
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_days_in_stage
    FROM ${tableName} 
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
  APPLICATION_STAGES,
  RC_TYPES,
  COLLECTION_TYPES,
  STAGE_TRANSITIONS,
  STAGE_REQUIRED_FIELDS,
  CONDITIONAL_REQUIRED_FIELDS,
  STAGE_COLORS,
  STAGE_LABELS,
  validateStageTransition,
  validateRequiredFields,
  validateFieldValues,
  updateApplicationStage,
  updateLeadApplicationStage,
  updateLoanApplicationStage,
  getStageHistory,
  getLeadStageHistory,
  getLoanStageHistory,
  autoCancelExpiredApprovals,
  getStageStatistics
};