import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.js';
import {
  summarize,
  generateReply,
  rewrite,
  generateFollowUp,
  verifyAPIKey,
} from '../controllers/ai.controller.js';

const router = Router();

// Use optional auth - allows Gmail Add-on to authenticate via userEmail
router.use(optionalAuthenticate);

router.get('/verify-key', verifyAPIKey);
router.post('/summarize', summarize);
router.post('/reply', generateReply);
router.post('/rewrite', rewrite);
router.post('/followup', generateFollowUp);

export default router;

