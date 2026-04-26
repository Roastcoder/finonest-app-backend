import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, searchUser, getTeamMembers, getHierarchyTree, getManagerTeamHierarchy, getUsersByRole, approveUser, rejectUser, updateExistingUsersStatus, generateReferCodes, getMyTeam } from '../controllers/userController.js';
import { authenticate, authorize, applyDataFilters, requireMinimumRole } from '../middleware/enhancedAuth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// Apply authentication and data filters to all routes
router.use(authenticate);
router.use(applyDataFilters);

// Hierarchy and team management (accessible to managers and above)
router.get('/hierarchy', requireMinimumRole('team_leader'), getHierarchyTree);
router.get('/by-role', authorize('admin'), getUsersByRole);
router.get('/my-team/hierarchy', authorize('admin', 'ops_team', 'sales_manager', 'manager', 'branch_manager', 'dsa', 'team_leader'), getManagerTeamHierarchy);
router.get('/my-team', authorize('admin', 'ops_team', 'sales_manager', 'manager', 'branch_manager', 'dsa', 'team_leader'), getMyTeam);

// User management (with proper authorization)
router.get('/', requireMinimumRole('sales_manager'), getAllUsers);
router.get('/search', requireMinimumRole('team_leader'), searchUser);
router.get('/team/:leaderId', requireMinimumRole('team_leader'), getTeamMembers);
router.get('/:id', getUserById);

// User creation and modification (requires higher privileges)
router.post('/', requireMinimumRole('sales_manager'), auditLogger('users', 'CREATE_USER'), createUser);
router.put('/:id/approve', requireMinimumRole('sales_manager'), auditLogger('users', 'APPROVE_USER'), approveUser);
router.put('/:id/reject', requireMinimumRole('sales_manager'), auditLogger('users', 'REJECT_USER'), rejectUser);
router.put('/:id', requireMinimumRole('sales_manager'), auditLogger('users', 'UPDATE_USER'), updateUser);

// Admin-only operations
router.put('/generate-refer-codes', authorize('admin'), auditLogger('users', 'GENERATE_REFER_CODES'), generateReferCodes);
router.put('/update-existing-status', authorize('admin'), auditLogger('users', 'UPDATE_EXISTING_STATUS'), updateExistingUsersStatus);
router.delete('/:id', authorize('admin'), auditLogger('users', 'DELETE_USER'), deleteUser);

export default router;
