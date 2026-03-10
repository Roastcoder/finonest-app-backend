import express from 'express';
import { getAllLeads, getLeadById, createLead, updateLead, deleteLead, getCustomerProfile, upsertCustomerProfile, cloneLead } from '../controllers/leadController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.post('/', auditLogger('leads', 'CREATE_LEAD'), createLead);
router.put('/:id', auditLogger('leads', 'UPDATE_LEAD'), updateLead);
router.delete('/:id', auditLogger('leads', 'DELETE_LEAD'), deleteLead);

router.get('/:id/profile', getCustomerProfile);
router.post('/:id/profile', auditLogger('customer_profiles', 'UPSERT_PROFILE'), upsertCustomerProfile);
router.post('/:id/clone', auditLogger('leads', 'CLONE_LEAD'), cloneLead);

export default router;
