import express from 'express';
import { 
  getFinancierLocations, 
  createFinancierLocation, 
  updateFinancierLocation, 
  deleteFinancierLocation,
  getFinancierRates,
  createFinancierRate,
  updateFinancierRate
} from '../controllers/financierController.js';
import { authenticate, authorize  } from '../middleware/enhancedAuth.js';

const router = express.Router();

router.get('/:bankId/locations', authenticate, getFinancierLocations);
router.post('/locations', authenticate, authorize(['admin']), createFinancierLocation);
router.patch('/locations/:id', authenticate, authorize(['admin']), updateFinancierLocation);
router.delete('/locations/:id', authenticate, authorize(['admin']), deleteFinancierLocation);

router.get('/:bankId/rates', authenticate, getFinancierRates);
router.post('/rates', authenticate, authorize(['admin']), createFinancierRate);
router.patch('/rates/:id', authenticate, authorize(['admin']), updateFinancierRate);

export default router;
