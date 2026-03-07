import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, searchUser, getTeamMembers } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'manager', 'team_leader'), getAllUsers);
router.get('/search', authorize('admin', 'manager', 'team_leader'), searchUser);
router.get('/team/:leaderId', authorize('admin', 'manager', 'team_leader'), getTeamMembers);
router.get('/:id', getUserById);
router.post('/', authorize('admin', 'manager'), createUser);
router.put('/:id/role', authorize('admin', 'manager'), updateUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
