import { Router } from 'express';
import {
  googleAuth,
  getAuthUrl,
  handleCallback,
  getMe,
  connectExtension,
  disconnectExtension,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/url', getAuthUrl);
router.get('/google/callback', handleCallback);
router.post('/google', googleAuth);
router.post('/me', authenticate, getMe);
router.post('/extension/connect', authenticate, connectExtension);
router.post('/extension/disconnect', authenticate, disconnectExtension);

export default router;

