import applicationStageLogic from '../utils/applicationStageLogic.js';
import db from '../config/database.js';

// Middleware to validate stage transitions
export const validateStageTransition = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const { stage: newStage } = req.body;
    
    if (!newStage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    // Validate stage exists
    if (!Object.values(applicationStageLogic.APPLICATION_STAGES).includes(newStage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    
    // Get current stage
    const result = await db.query(
      'SELECT application_stage FROM leads WHERE id = $1',
      [leadId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const currentStage = result.rows[0].application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED;
    
    // Validate transition
    applicationStageLogic.validateStageTransition(currentStage, newStage);
    
    // Add current stage to request for use in controller
    req.currentStage = currentStage;
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Middleware to validate required fields for stage
export const validateStageFields = (req, res, next) => {
  try {
    const { stage: newStage, ...stageData } = req.body;
    
    // Validate required fields
    applicationStageLogic.validateRequiredFields(newStage, stageData);
    
    // Validate field values
    applicationStageLogic.validateFieldValues(newStage, stageData);
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Middleware to check user permissions for stage updates
export const checkStageUpdatePermissions = (req, res, next) => {
  const userRole = req.user.role;
  const { stage: newStage } = req.body;
  
  // Define role-based permissions for each stage
  const rolePermissions = {
    'executive': [
      applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      applicationStageLogic.APPLICATION_STAGES.LOGIN,
      applicationStageLogic.APPLICATION_STAGES.IN_PROCESS
    ],
    'team_leader': [], // Team leaders cannot update any stages
    'manager': [
      applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      applicationStageLogic.APPLICATION_STAGES.LOGIN,
      applicationStageLogic.APPLICATION_STAGES.IN_PROCESS,
      applicationStageLogic.APPLICATION_STAGES.APPROVED,
      applicationStageLogic.APPLICATION_STAGES.REJECTED,
      applicationStageLogic.APPLICATION_STAGES.DISBURSED,
      applicationStageLogic.APPLICATION_STAGES.CANCELLED
    ],
    'admin': Object.values(applicationStageLogic.APPLICATION_STAGES)
  };
  
  const allowedStages = rolePermissions[userRole] || [];
  
  if (!allowedStages.includes(newStage)) {
    return res.status(403).json({ 
      error: `Access denied. ${userRole} role cannot update application status.`,
      message: userRole === 'team_leader' ? 'Team leaders cannot update loan application status.' : `Insufficient permissions to update status to ${newStage}` 
    });
  }
  
  next();
};

// Middleware to validate lead ownership/access
export const validateLeadAccess = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Team leaders cannot update loan applications at all
    if (userRole === 'team_leader') {
      return res.status(403).json({ 
        error: 'Access denied. Team leaders cannot update loan application status.',
        message: 'Please contact your manager for loan status updates.'
      });
    }
    
    // Admin can access all leads
    if (userRole === 'admin') {
      return next();
    }
    
    let query = 'SELECT assigned_to, created_by FROM loans WHERE id = $1';
    const params = [leadId];
    
    // Add role-based access control
    if (userRole === 'executive') {
      query += ' AND (assigned_to = $2 OR created_by = $2)';
      params.push(userId);
    } else if (userRole === 'manager') {
      query += ` AND (
        assigned_to IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $2
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        ) OR created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $2
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        ) OR assigned_to = $2 OR created_by = $2
      )`;
      params.push(userId);
    }
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found or access denied' });
    }
    
    next();
  } catch (error) {
    console.error('Lead access validation error:', error);
    res.status(500).json({ error: 'Access validation failed' });
  }
};

// Middleware to log stage changes
export const logStageChange = async (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    // Log successful stage changes
    if (res.statusCode === 200 && data.success) {
      console.log(`Stage change logged: Lead ${req.params.id} updated from ${req.currentStage} to ${req.body.stage} by user ${req.user.id}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware to validate stage data format
export const validateStageDataFormat = (req, res, next) => {
  try {
    const { stage, ...stageData } = req.body;
    
    // Validate specific field formats based on stage
    switch (stage) {
      case applicationStageLogic.APPLICATION_STAGES.LOGIN:
        if (stageData.appScore !== undefined && (isNaN(stageData.appScore) || stageData.appScore < 0 || stageData.appScore > 1000)) {
          return res.status(400).json({ error: 'App Score must be between 0 and 1000' });
        }
        if (stageData.creditScore !== undefined && (isNaN(stageData.creditScore) || stageData.creditScore < 300 || stageData.creditScore > 900)) {
          return res.status(400).json({ error: 'Credit Score must be between 300 and 900' });
        }
        break;
        
      case applicationStageLogic.APPLICATION_STAGES.IN_PROCESS:
        if (stageData.tags && !Array.isArray(stageData.tags)) {
          return res.status(400).json({ error: 'Tags must be an array' });
        }
        break;
        
      case applicationStageLogic.APPLICATION_STAGES.APPROVED:
      case applicationStageLogic.APPLICATION_STAGES.DISBURSED:
        if (stageData.loanAmount && (isNaN(stageData.loanAmount) || stageData.loanAmount <= 0)) {
          return res.status(400).json({ error: 'Loan amount must be a positive number' });
        }
        if (stageData.roi && (isNaN(stageData.roi) || stageData.roi <= 0 || stageData.roi > 100)) {
          return res.status(400).json({ error: 'ROI must be between 0 and 100' });
        }
        if (stageData.tenure && (isNaN(stageData.tenure) || stageData.tenure <= 0)) {
          return res.status(400).json({ error: 'Tenure must be a positive number' });
        }
        break;
        
      case applicationStageLogic.APPLICATION_STAGES.DISBURSED:
        if (stageData.rcType && !Object.values(applicationStageLogic.RC_TYPES).includes(stageData.rcType)) {
          return res.status(400).json({ error: 'Invalid RC Type' });
        }
        if (stageData.collectedBy && !Object.values(applicationStageLogic.COLLECTION_TYPES).includes(stageData.collectedBy)) {
          return res.status(400).json({ error: 'Invalid Collection Type' });
        }
        
        // Validate mobile numbers
        const mobileFields = ['agentMobile', 'bankerMobile'];
        for (const field of mobileFields) {
          if (stageData[field] && !/^[6-9]\d{9}$/.test(stageData[field])) {
            return res.status(400).json({ error: `${field} must be a valid 10-digit mobile number` });
          }
        }
        break;
    }
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Middleware to prevent duplicate stage updates
export const preventDuplicateStageUpdate = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const { stage: newStage } = req.body;
    
    const result = await db.query(
      'SELECT application_stage, updated_at FROM leads WHERE id = $1',
      [leadId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const currentStage = result.rows[0].application_stage;
    const lastUpdated = new Date(result.rows[0].updated_at);
    const now = new Date();
    
    // Prevent updating to same stage within 1 minute
    if (currentStage === newStage && (now - lastUpdated) < 60000) {
      return res.status(400).json({ 
        error: 'Duplicate stage update detected. Please wait before updating again.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Duplicate stage update check error:', error);
    res.status(500).json({ error: 'Duplicate check failed' });
  }
};

export default {
  validateStageTransition,
  validateStageFields,
  checkStageUpdatePermissions,
  validateLeadAccess,
  logStageChange,
  validateStageDataFormat,
  preventDuplicateStageUpdate
};