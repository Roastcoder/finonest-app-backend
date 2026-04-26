import express from 'express';
import { getUserPermissions, checkPermission, getDashboardPermissions, updateUserPermissions } from '../controllers/permissionsController.js';
import { authenticate, authorize, requireMinimumRole } from '../middleware/enhancedAuth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get current user's permissions
router.get('/user', getUserPermissions);

// Get dashboard-specific permissions
router.get('/dashboard', getDashboardPermissions);

// Check specific permission
router.get('/check/:permission', checkPermission);

// Update user permissions (admin only)
router.put('/user', authorize('admin'), updateUserPermissions);

export default router;