import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, searchUser, getTeamMembers, getHierarchyTree, getManagerTeamHierarchy, getUsersByRole, approveUser, rejectUser, updateExistingUsersStatus, generateReferCodes, getMyTeam } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);

router.get('/hierarchy', authorize('admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), getHierarchyTree);
router.get('/by-role', authorize('admin', 'operation_team'), getUsersByRole);
router.get('/my-team/hierarchy', authorize('operation_team', 'sales_manager', 'branch_manager', 'dsa'), getManagerTeamHierarchy);
router.get('/my-team', authorize('branch_manager'), getMyTeam);
router.get('/', authorize('admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), getAllUsers);
router.get('/search', authorize('admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), searchUser);
router.get('/team/:leaderId', authorize('admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), getTeamMembers);
router.get('/:id', getUserById);
router.post('/', authorize('admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), auditLogger('users', 'CREATE_USER'), createUser);
router.put('/:id/approve', authorize('admin', 'operation_team', 'sales_manager'), auditLogger('users', 'APPROVE_USER'), approveUser);
router.put('/:id/reject', authorize('admin', 'operation_team', 'sales_manager'), auditLogger('users', 'REJECT_USER'), rejectUser);
router.put('/:id', authorize('admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa'), auditLogger('users', 'UPDATE_USER'), updateUser);
router.put('/generate-refer-codes', authorize('admin'), auditLogger('users', 'GENERATE_REFER_CODES'), generateReferCodes);
router.put('/update-existing-status', authorize('admin'), auditLogger('users', 'UPDATE_EXISTING_STATUS'), updateExistingUsersStatus);
router.delete('/:id', authorize('admin'), auditLogger('users', 'DELETE_USER'), deleteUser);

export default router;
