import { Router } from 'express';
import {
  googleAuth,
  getAuthUrl,
  handleCallback,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/url', getAuthUrl);
router.get('/google/callback', handleCallback);
router.post('/google', googleAuth);
router.get('/me', authenticate, getMe);

export default router;

