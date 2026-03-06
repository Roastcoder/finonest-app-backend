import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'manager'), getAllUsers);
router.get('/:id', getUserById);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
