import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, searchUser, getTeamMembers, getHierarchyTree, getManagerTeamHierarchy, getUsersByRole } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);

router.get('/hierarchy', authorize('admin', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), getHierarchyTree);
router.get('/by-role', authorize('admin'), getUsersByRole);
router.get('/my-team/hierarchy', authorize('branch_manager', 'dsa'), getManagerTeamHierarchy);
router.get('/', authorize('admin', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), getAllUsers);
router.get('/search', authorize('admin', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), searchUser);
router.get('/team/:leaderId', authorize('admin', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), getTeamMembers);
router.get('/:id', getUserById);
router.post('/', authorize('admin', 'sales_manager', 'branch_manager', 'dsa', 'team_leader'), auditLogger('users', 'CREATE_USER'), createUser);
router.put('/:id', authorize('admin', 'sales_manager', 'branch_manager', 'dsa'), auditLogger('users', 'UPDATE_USER'), updateUser);
router.delete('/:id', authorize('admin'), auditLogger('users', 'DELETE_USER'), deleteUser);

export default router;
