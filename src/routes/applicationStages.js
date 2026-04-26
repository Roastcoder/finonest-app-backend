import express from 'express';
import applicationStageController from '../controllers/applicationStageController.js';
import { authenticate  } from '../middleware/enhancedAuth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import applicationStageValidation from '../middleware/applicationStageValidation.js';

const router = express.Router();

router.use(authenticate);

// Stage Management Routes
router.put('/:id/stage', 
  auditLogger('leads', 'UPDATE_APPLICATION_STAGE'),
  applicationStageValidation.validateLeadAccess,
  applicationStageValidation.validateStageTransition,
  applicationStageValidation.validateStageDataFormat,
  applicationStageValidation.validateStageFields,
  applicationStageValidation.checkStageUpdatePermissions,
  applicationStageValidation.preventDuplicateStageUpdate,
  applicationStageValidation.logStageChange,
  applicationStageController.updateApplicationStage
);

router.get('/:id/stage-history', 
  applicationStageController.getApplicationStageHistory
);

router.get('/:id/available-transitions', 
  applicationStageController.getAvailableTransitions
);

// Stage Configuration Routes
router.get('/stage-config/:stage', 
  applicationStageController.getStageConfiguration
);

// Analytics Routes
router.get('/stage-statistics', 
  applicationStageController.getStageStatistics
);

router.get('/stage-flow-analytics', 
  applicationStageController.getStageFlowAnalytics
);

// Stage-based Lead Queries
router.get('/by-stage/:stage', 
  applicationStageController.getLeadsByStage
);

// Validation Routes
router.post('/validate-transition', 
  applicationStageController.validateStageTransition
);

// Bulk Operations
router.post('/bulk-update-stages', 
  auditLogger('leads', 'BULK_UPDATE_STAGES'),
  applicationStageController.bulkUpdateStages
);

// System Operations
router.post('/auto-cancel', 
  applicationStageController.runAutoCancellation
);

export default router;
