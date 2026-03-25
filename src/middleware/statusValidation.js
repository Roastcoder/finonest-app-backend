import leadStatusLogic from '../utils/leadStatusLogic.js';
import db from '../config/database.js';

// Middleware to validate status transitions
export const validateStatusTransition = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const { stage: newStatus } = req.body;
    
    if (!newStatus) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get current status
    const result = await db.query(
      'SELECT application_stage FROM leads WHERE id = $1',
      [leadId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const currentStatus = result.rows[0].application_stage || leadStatusLogic.LEAD_STATUSES.SUBMITTED;
    
    // Validate transition
    leadStatusLogic.validateStatusTransition(currentStatus, newStatus);
    
    // Add current status to request for use in controller
    req.currentStatus = currentStatus;
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Middleware to validate required fields for status
export const validateStatusFields = (req, res, next) => {
  try {
    const { stage: newStatus, ...statusData } = req.body;
    
    // Validate required fields
    leadStatusLogic.validateRequiredFields(newStatus, statusData);
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Middleware to check user permissions for status updates
export const checkStatusUpdatePermissions = (req, res, next) => {
  const userRole = req.user.role;
  const { stage: newStatus } = req.body;
  
  // Define role-based permissions
  const rolePermissions = {
    'executive': [
      leadStatusLogic.LEAD_STATUSES.SUBMITTED,
      leadStatusLogic.LEAD_STATUSES.LOGIN,
      leadStatusLogic.LEAD_STATUSES.IN_PROCESS
    ],
    'team_leader': [
      leadStatusLogic.LEAD_STATUSES.SUBMITTED,
      leadStatusLogic.LEAD_STATUSES.LOGIN,
      leadStatusLogic.LEAD_STATUSES.IN_PROCESS,
      leadStatusLogic.LEAD_STATUSES.APPROVED,
      leadStatusLogic.LEAD_STATUSES.REJECTED
    ],
    'manager': Object.values(leadStatusLogic.LEAD_STATUSES),
    'admin': Object.values(leadStatusLogic.LEAD_STATUSES)
  };
  
  const allowedStatuses = rolePermissions[userRole] || [];
  
  if (!allowedStatuses.includes(newStatus)) {
    return res.status(403).json({ 
      error: `Insufficient permissions to update status to ${newStatus}` 
    });
  }
  
  next();
};

// Middleware to log status changes
export const logStatusChange = async (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    // Log successful status changes
    if (res.statusCode === 200 && data.success) {
      console.log(`Status change logged: Lead ${req.params.id} updated to ${req.body.stage} by user ${req.user.id}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

export default {
  validateStatusTransition,
  validateStatusFields,
  checkStatusUpdatePermissions,
  logStatusChange
};