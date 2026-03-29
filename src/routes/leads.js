import express from 'express';
import { getAllLeads, getLeadById, createLead, updateLead, deleteLead, getCustomerProfile, upsertCustomerProfile, cloneLead, updateLeadStage, getLeadStatusHistory, getStatusStatistics, validateStatusTransition } from '../controllers/leadController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import statusValidation from '../middleware/statusValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLeads);
router.get('/statistics', getStatusStatistics);
router.post('/', auditLogger('leads', 'CREATE_LEAD'), createLead);

router.get('/:id/profile', getCustomerProfile);
router.post('/:id/profile', auditLogger('customer_profiles', 'UPSERT_PROFILE'), upsertCustomerProfile);
router.post('/:id/clone', auditLogger('leads', 'CLONE_LEAD'), cloneLead);
router.get('/:id/status-history', getLeadStatusHistory);
router.put('/:id/stage', 
  auditLogger('leads', 'CONVERT_TO_LOAN'),
  statusValidation.validateStatusTransition,
  statusValidation.validateStatusFields,
  statusValidation.checkStatusUpdatePermissions,
  statusValidation.logStatusChange,
  updateLeadStage
);
router.post('/validate-transition', validateStatusTransition);

router.get('/:id', getLeadById);
router.put('/:id', auditLogger('leads', 'UPDATE_LEAD'), updateLead);
router.delete('/:id', auditLogger('leads', 'DELETE_LEAD'), deleteLead);

export default router;