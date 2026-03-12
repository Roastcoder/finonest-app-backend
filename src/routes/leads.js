import express from 'express';
import { getAllLeads, getLeadById, createLead, updateLead, deleteLead, getCustomerProfile, upsertCustomerProfile, cloneLead, updateLeadStage, getLeadStatusHistory, getStatusStatistics, validateStatusTransition, runAutoCancellation } from '../controllers/leadController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import statusValidation from '../middleware/statusValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLeads);
router.get('/statistics', getStatusStatistics);
router.get('/:id', getLeadById);
router.post('/', auditLogger('leads', 'CREATE_LEAD'), createLead);
router.put('/:id', auditLogger('leads', 'UPDATE_LEAD'), updateLead);
router.delete('/:id', auditLogger('leads', 'DELETE_LEAD'), deleteLead);

router.get('/:id/profile', getCustomerProfile);
router.post('/:id/profile', auditLogger('customer_profiles', 'UPSERT_PROFILE'), upsertCustomerProfile);
router.post('/:id/clone', auditLogger('leads', 'CLONE_LEAD'), cloneLead);
router.put('/:id/stage', 
  auditLogger('leads', 'UPDATE_STAGE'),
  statusValidation.validateStatusTransition,
  statusValidation.validateStatusFields,
  statusValidation.checkStatusUpdatePermissions,
  statusValidation.logStatusChange,
  updateLeadStage
);
router.get('/:id/status-history', getLeadStatusHistory);
router.post('/validate-transition', validateStatusTransition);
router.post('/auto-cancel', runAutoCancellation);

export default router;
