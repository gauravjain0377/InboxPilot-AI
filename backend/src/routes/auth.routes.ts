import { Router } from 'express';
import { googleAuth, getAuthUrl, handleCallback } from '../controllers/auth.controller.js';

const router = Router();

router.get('/url', getAuthUrl);
router.get('/google/callback', handleCallback);
router.post('/google', googleAuth);

export default router;

