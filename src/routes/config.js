import express from 'express';
import { 
  getAllConfigs, 
  getConfigByKey, 
  createConfig, 
  updateConfig,
  updateConfigByKey,
  deleteConfig, 
  getConfigsByType, 
  bulkUpdateConfigs, 
  resetToDefaults,
  toggleStageAccess
} from '../controllers/systemConfigController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Public routes (all authenticated users can access)
router.get('/', getAllConfigs);
router.get('/key/:key', getConfigByKey);
router.get('/type/:type', getConfigsByType);

// Admin-only routes
router.use(authorize('admin'));
router.post('/', createConfig);
router.post('/toggle-stage', toggleStageAccess);
router.put('/:id', updateConfig);
router.patch('/:id', updateConfig);
router.patch('/key/:key', updateConfigByKey);
router.put('/bulk/update', bulkUpdateConfigs);
router.post('/reset', resetToDefaults);
router.delete('/:id', deleteConfig);

export default router;
