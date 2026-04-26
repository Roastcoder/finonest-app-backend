import express from 'express';
import { getDSAFolios, getAllEntries, importBankStatement, getAllFolios, approveEntry } from '../controllers/rcLimitController.js';
import { authenticate, authorize  } from '../middleware/enhancedAuth.js';

const router = express.Router();

router.use(authenticate);

router.get('/folios', authorize('dsa'), getDSAFolios);
router.get('/entries', authorize('ops_team'), getAllEntries);
router.post('/import', authorize('ops_team'), importBankStatement);
router.get('/admin/folios', authorize('admin'), getAllFolios);
router.patch('/entries/:id/approve', authorize('admin'), approveEntry);

export default router;
