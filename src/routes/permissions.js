import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getPermissions, updatePermissions, getAllRolePermissions, resetPermissions } from '../controllers/permissionsController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getPermissions);
router.get('/all', getAllRolePermissions);
router.put('/', updatePermissions);
router.post('/reset', resetPermissions);

export default router;
