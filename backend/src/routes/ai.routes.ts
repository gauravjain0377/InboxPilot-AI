import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  summarize,
  generateReply,
  rewrite,
  generateFollowUp,
} from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticate);

router.post('/summarize', summarize);
router.post('/reply', generateReply);
router.post('/rewrite', rewrite);
router.post('/followup', generateFollowUp);

export default router;

