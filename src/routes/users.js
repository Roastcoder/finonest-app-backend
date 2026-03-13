import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, searchUser, getTeamMembers, getHierarchyTree, getManagerTeamHierarchy } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);

router.get('/hierarchy', authorize('admin', 'ops_team', 'sales_manager', 'team_leader'), getHierarchyTree);
router.get('/my-team/hierarchy', authorize('manager', 'dsa'), getManagerTeamHierarchy);
router.get('/', authorize('admin', 'manager', 'team_leader'), getAllUsers);
router.get('/search', authorize('admin', 'manager', 'team_leader'), searchUser);
router.get('/team/:leaderId', authorize('admin', 'manager', 'team_leader'), getTeamMembers);
router.get('/:id', getUserById);
router.post('/', authorize('admin', 'manager', 'dsa'), auditLogger('users', 'CREATE_USER'), createUser);
router.put('/:id/role', authorize('admin', 'manager'), auditLogger('users', 'UPDATE_USER_ROLE'), updateUser);
router.put('/:id', authorize('admin'), auditLogger('users', 'UPDATE_USER'), updateUser);
router.delete('/:id', authorize('admin'), auditLogger('users', 'DELETE_USER'), deleteUser);

export default router;
