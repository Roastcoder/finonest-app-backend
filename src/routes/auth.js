import express from 'express';
import { login, signup, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/profile', authenticate, getProfile);

export default router;
