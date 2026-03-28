import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createFollowUpConfig,
  getFollowUps,
  updateFollowUpStatus,
  updateFollowUpDraft,
  updateFollowUpConfig
} from '../controllers/followup.controller.js';

const router = Router();

router.use(authenticate);

// List followups
router.get('/', getFollowUps);

// Create config when sending initial email
router.post('/config', createFollowUpConfig);

// Update status (e.g., snooze, cancel, approve)
router.put('/:id/status', updateFollowUpStatus);

// Update draft
router.put('/:id/draft', updateFollowUpDraft);

// Update config (mode, tone, scheduledTime)
router.put('/:id/config', updateFollowUpConfig);

export default router;
