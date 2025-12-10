import { Router } from 'express';
import { googleAuth, getAuthUrl } from '../controllers/auth.controller.js';

const router = Router();

router.post('/google', googleAuth);
router.get('/url', getAuthUrl);

export default router;

