import express from 'express';
import { getAllLoans, getLoanById, createLoan, deleteLoan, updateLoanApplicationStage, getLoanApplicationStageHistory, getLoanAvailableTransitions } from '../controllers/loanController.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import applicationStageValidation from '../middleware/applicationStageValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllLoans);
router.get('/:id', getLoanById);
router.post('/', auditLogger('loans', 'CREATE_LOAN'), createLoan);
router.delete('/:id', auditLogger('loans', 'DELETE_LOAN'), deleteLoan);

// Application Stage Management for Loans
router.put('/:id/application-stage', 
  auditLogger('loans', 'UPDATE_APPLICATION_STAGE'),
  applicationStageValidation.validateLeadAccess,
  applicationStageValidation.validateStageTransition,
  applicationStageValidation.validateStageDataFormat,
  applicationStageValidation.validateStageFields,
  applicationStageValidation.checkStageUpdatePermissions,
  applicationStageValidation.preventDuplicateStageUpdate,
  applicationStageValidation.logStageChange,
  updateLoanApplicationStage
);

router.get('/:id/application-stage-history', getLoanApplicationStageHistory);
router.get('/:id/available-transitions', getLoanAvailableTransitions);

export default router;
