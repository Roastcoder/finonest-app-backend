import express from 'express';
import { getAllBrokers, getBrokerById, createBroker, updateBroker, deleteBroker } from '../controllers/brokerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllBrokers);
router.get('/:id', getBrokerById);
router.post('/', authorize('admin', 'manager'), createBroker);
router.put('/:id', authorize('admin', 'manager'), updateBroker);
router.delete('/:id', authorize('admin'), deleteBroker);

export default router;
