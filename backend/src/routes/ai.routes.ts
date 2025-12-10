import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.js';
import {
  summarize,
  generateReply,
  rewrite,
  generateFollowUp,
} from '../controllers/ai.controller.js';

const router = Router();

// Use optional auth - allows extension to work without token when emailBody is provided
router.use(optionalAuthenticate);

router.post('/summarize', summarize);
router.post('/reply', generateReply);
router.post('/rewrite', rewrite);
router.post('/followup', generateFollowUp);

export default router;

