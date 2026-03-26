import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { rcLookup, getCreditReport, tagLead, updateLinkLoanChecked, autoCheckForLoan } from '../controllers/linkLoanController.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

const LINK_LOAN_ROLES = ['admin', 'sales_manager', 'branch_manager'];

router.use(authenticate);
router.use(authorize(...LINK_LOAN_ROLES));

router.post('/rc-lookup', auditLogger('rc_cache', 'LINK_LOAN_RC_LOOKUP'), rcLookup);
router.post('/credit-report', auditLogger('experian_credit_cache', 'LINK_LOAN_CREDIT_FETCH'), getCreditReport);
router.post('/tag-lead', auditLogger('leads', 'LINK_LOAN_TAG'), tagLead);
router.post('/link-loan-checked', auditLogger('loans', 'LINK_LOAN_CHECKED'), updateLinkLoanChecked);
router.get('/auto-check/:loan_id', autoCheckForLoan);

export default router;
