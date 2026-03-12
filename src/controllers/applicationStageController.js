import applicationStageLogic from '../utils/applicationStageLogic.js';
import db from '../config/database.js';

// Update Application Stage
export const updateApplicationStage = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { stage: newStage, ...stageData } = req.body;
    
    const result = await applicationStageLogic.updateLeadApplicationStage(
      leadId,
      newStage,
      stageData,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Update application stage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Application Stage History
export const getApplicationStageHistory = async (req, res) => {
  try {
    const leadId = req.params.id;
    const history = await applicationStageLogic.getLeadStageHistory(leadId);
    res.json(history);
  } catch (error) {
    console.error('Get application stage history error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Stage Statistics
export const getStageStatistics = async (req, res) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      assignedTo: req.query.assignedTo
    };
    
    const stats = await applicationStageLogic.getStageStatistics(filters);
    res.json(stats);
  } catch (error) {
    console.error('Get stage statistics error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Stage Flow Analytics
export const getStageFlowAnalytics = async (req, res) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    
    const analytics = await applicationStageLogic.getStageFlowAnalytics(filters);
    res.json(analytics);
  } catch (error) {
    console.error('Get stage flow analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Validate Stage Transition
export const validateStageTransition = async (req, res) => {
  try {
    const { currentStage, newStage } = req.body;
    
    applicationStageLogic.validateStageTransition(currentStage, newStage);
    
    res.json({ 
      valid: true, 
      message: `Transition from ${currentStage} to ${newStage} is valid` 
    });
  } catch (error) {
    res.status(400).json({ 
      valid: false, 
      error: error.message 
    });
  }
};

// Get Available Transitions
export const getAvailableTransitions = async (req, res) => {
  try {
    const leadId = req.params.id;
    
    // Get current stage
    const result = await db.query(
      'SELECT application_stage FROM leads WHERE id = $1',
      [leadId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const currentStage = result.rows[0].application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED;
    const availableTransitions = applicationStageLogic.STAGE_TRANSITIONS[currentStage] || [];
    
    res.json({
      currentStage,
      availableTransitions,
      transitionDetails: availableTransitions.map(stage => ({
        stage,
        label: applicationStageLogic.STAGE_LABELS[stage],
        color: applicationStageLogic.STAGE_COLORS[stage],
        requiredFields: applicationStageLogic.STAGE_REQUIRED_FIELDS[stage] || []
      }))
    });
  } catch (error) {
    console.error('Get available transitions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Stage Configuration
export const getStageConfiguration = async (req, res) => {
  try {
    const stage = req.params.stage;
    
    if (!Object.values(applicationStageLogic.APPLICATION_STAGES).includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    
    const config = {
      stage,
      label: applicationStageLogic.STAGE_LABELS[stage],
      color: applicationStageLogic.STAGE_COLORS[stage],
      requiredFields: applicationStageLogic.STAGE_REQUIRED_FIELDS[stage] || [],
      conditionalFields: applicationStageLogic.CONDITIONAL_REQUIRED_FIELDS[stage] || {},
      availableTransitions: applicationStageLogic.STAGE_TRANSITIONS[stage] || []
    };
    
    // Add field definitions for complex stages
    if (stage === applicationStageLogic.APPLICATION_STAGES.DISBURSED) {
      config.fieldDefinitions = {
        rcType: {
          type: 'select',
          options: Object.values(applicationStageLogic.RC_TYPES),
          labels: {
            [applicationStageLogic.RC_TYPES.PHYSICAL_RC]: 'Physical RC',
            [applicationStageLogic.RC_TYPES.DIGITAL_RC]: 'Digital RC'
          }
        },
        collectedBy: {
          type: 'select',
          options: Object.values(applicationStageLogic.COLLECTION_TYPES),
          labels: {
            [applicationStageLogic.COLLECTION_TYPES.SELF]: 'Self',
            [applicationStageLogic.COLLECTION_TYPES.RTO_AGENT]: 'RTO Agent',
            [applicationStageLogic.COLLECTION_TYPES.BANKER]: 'Banker'
          }
        }
      };
    }
    
    res.json(config);
  } catch (error) {
    console.error('Get stage configuration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Run Auto-Cancellation
export const runAutoCancellation = async (req, res) => {
  try {
    const results = await applicationStageLogic.autoCancelExpiredApprovals();
    res.json({
      message: 'Auto-cancellation process completed',
      results
    });
  } catch (error) {
    console.error('Auto-cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Leads by Stage
export const getLeadsByStage = async (req, res) => {
  try {
    const stage = req.params.stage;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!Object.values(applicationStageLogic.APPLICATION_STAGES).includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             b.name as financier_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users creator ON l.created_by = creator.id
      LEFT JOIN banks b ON l.financier_id = b.id
      WHERE l.application_stage = $1
    `;
    
    const params = [stage];
    let paramIndex = 2;
    
    // Apply role-based filtering
    if (req.user.role === 'team_leader') {
      query += ` AND (l.assigned_to IN (SELECT id FROM users WHERE reporting_to = $${paramIndex}) 
                 OR l.created_by IN (SELECT id FROM users WHERE reporting_to = $${paramIndex}))`;
      params.push(req.user.id);
      paramIndex++;
    } else if (req.user.role === 'manager') {
      query += ` AND (l.assigned_to IN (
        WITH RECURSIVE team_hierarchy AS (
          SELECT id FROM users WHERE reporting_to = $${paramIndex}
          UNION ALL
          SELECT u.id FROM users u
          INNER JOIN team_hierarchy t ON u.reporting_to = t.id
        )
        SELECT id FROM team_hierarchy
      ) OR l.created_by IN (
        WITH RECURSIVE team_hierarchy AS (
          SELECT id FROM users WHERE reporting_to = $${paramIndex}
          UNION ALL
          SELECT u.id FROM users u
          INNER JOIN team_hierarchy t ON u.reporting_to = t.id
        )
        SELECT id FROM team_hierarchy
      ))`;
      params.push(req.user.id);
      paramIndex++;
    }
    
    query += ` ORDER BY l.updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM leads WHERE application_stage = $1`;
    const countParams = [stage];
    
    if (req.user.role === 'team_leader') {
      countQuery += ` AND (assigned_to IN (SELECT id FROM users WHERE reporting_to = $2) 
                      OR created_by IN (SELECT id FROM users WHERE reporting_to = $2))`;
      countParams.push(req.user.id);
    } else if (req.user.role === 'manager') {
      countQuery += ` AND (assigned_to IN (
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
      ))`;
      countParams.push(req.user.id);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      leads: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leads by stage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk Update Stages
export const bulkUpdateStages = async (req, res) => {
  try {
    const { leadIds, stage, stageData } = req.body;
    
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'Lead IDs array is required' });
    }
    
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    const results = [];
    
    for (const leadId of leadIds) {
      try {
        const result = await applicationStageLogic.updateLeadApplicationStage(
          leadId,
          stage,
          stageData,
          req.user.id
        );
        results.push({ leadId, success: true, result });
      } catch (error) {
        results.push({ leadId, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk update stages error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  updateApplicationStage,
  getApplicationStageHistory,
  getStageStatistics,
  getStageFlowAnalytics,
  validateStageTransition,
  getAvailableTransitions,
  getStageConfiguration,
  runAutoCancellation,
  getLeadsByStage,
  bulkUpdateStages
};