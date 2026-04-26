import express from 'express';
import { authenticate  } from '../middleware/enhancedAuth.js';
import {
  getDashboardStats,
  getFolioAccounts,
  createFolioAccount,
  deleteFolioAccount,
  getPayments,
  exportPayments,
  getBankAccounts,
  createBankAccount,
  deleteBankAccount
} from '../controllers/accountantController.js';

const router = express.Router();

router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Folio Accounts
router.get('/folio-accounts', getFolioAccounts);
router.post('/folio-accounts', createFolioAccount);
router.delete('/folio-accounts/:id', deleteFolioAccount);

// Payments
router.get('/payments', getPayments);
router.get('/payments/export', exportPayments);

// Bank Accounts
router.get('/bank-accounts', getBankAccounts);
router.post('/bank-accounts', createBankAccount);
router.delete('/bank-accounts/:id', deleteBankAccount);

export default router;
