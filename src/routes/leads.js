import express from 'express';
import { getAllLeads, getLeadById, createLead, updateLead, deleteLead, getCustomerProfile, upsertCustomerProfile, cloneLead, updateLeadStage, getLeadStatusHistory, getStatusStatistics, validateStatusTransition, searchLeadsBySourcingPerson, deleteLeadsBySourcingPerson } from '../controllers/leadController.js';
import { authenticate, authorize, applyDataFilters, requireMinimumRole } from '../middleware/enhancedAuth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import statusValidation from '../middleware/statusValidation.js';

const router = express.Router();

// Apply authentication and data filters to all routes
router.use(authenticate);
router.use(applyDataFilters);

// Get all leads (with data filtering)
router.get('/', getAllLeads);

// Get statistics (requires read permission)
router.get('/statistics', getStatusStatistics);

// Create lead (requires create permission)
router.post('/', auditLogger('leads', 'CREATE_LEAD'), createLead);

// Admin-only bulk operations
router.post('/search-by-sourcing-person', authorize('admin'), searchLeadsBySourcingPerson);
router.post('/delete-by-sourcing-person', authorize('admin'), auditLogger('leads', 'BULK_DELETE_BY_SOURCING_PERSON'), deleteLeadsBySourcingPerson);

// More specific routes BEFORE generic :id routes
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

// Generic routes AFTER specific ones
router.get('/:id', getLeadById);
router.put('/:id', auditLogger('leads', 'UPDATE_LEAD'), updateLead);
router.delete('/:id', requireMinimumRole('sales_manager'), auditLogger('leads', 'DELETE_LEAD'), deleteLead);

export default router;