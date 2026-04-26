import express from 'express';
import { getAllPolicies, createPolicy, getPolicyById } from '../controllers/insuranceController.js';
import { authenticate  } from '../middleware/enhancedAuth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllPolicies);
router.post('/', createPolicy);
router.get('/:id', getPolicyById);

export default router;
