import express from 'express';
import { getAllConfigs, updateConfig } from '../controllers/systemConfigController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), getAllConfigs);
router.patch('/:key', authorize('admin'), updateConfig);

export default router;
