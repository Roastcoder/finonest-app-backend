import express from 'express';
import { 
  getAllConfigs, 
  getConfigByKey, 
  createConfig, 
  updateConfig, 
  deleteConfig, 
  getConfigsByType, 
  bulkUpdateConfigs, 
  resetToDefaults 
} from '../controllers/systemConfigController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin')); // Only admins can manage system config

router.get('/', getAllConfigs);
router.get('/key/:key', getConfigByKey);
router.get('/type/:type', getConfigsByType);
router.post('/', createConfig);
router.put('/:id', updateConfig);
router.put('/bulk/update', bulkUpdateConfigs);
router.post('/reset', resetToDefaults);
router.delete('/:id', deleteConfig);

export default router;
