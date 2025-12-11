import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getMessages,
  getMessage,
  createDraft,
  sendMessage,
  watchInbox,
} from '../controllers/gmail.controller.js';
import { Email } from '../models/Email.js';

const router = Router();

router.use(authenticate);

router.get('/messages', getMessages);
router.get('/message/:id', getMessage);
router.post('/draft', createDraft);
router.post('/send', sendMessage);
router.post('/watch', watchInbox);
router.post('/apply-label', async (req: any, res, next) => {
  try {
    const { emailId, label, priority, category } = req.body;
    if (!emailId) {
      return res.status(400).json({ error: 'Email ID (thread or message) is required' });
    }
    
    const { User } = await import('../models/User.js');
    
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Best-effort update of Email document so analytics & dashboard stay in sync
    try {
      const update: any = {};

      if (priority || category) {
        update.$set = {};
        if (priority) {
          // Normalize priority to our enum values
          const normalizedPriority =
            priority === 'high' || priority === 'medium' || priority === 'low'
              ? priority
              : 'medium';
          update.$set.priority = normalizedPriority;
        }
        if (category) {
          update.$set.category = category;
        }
      }

      if (label) {
        update.$addToSet = { labels: label };
      }

      if (Object.keys(update).length > 0) {
        // Try matching by threadId first (what Gmail rows usually expose), then by gmailId
        await Email.updateMany(
          { userId: user._id, $or: [{ threadId: emailId }, { gmailId: emailId }] },
          update
        );
      }
    } catch (err) {
      // Do not fail the request if analytics update fails – just log
      console.error('Error updating Email document for apply-label:', err);
    }

    // Note: Gmail API label application would go here if/when you want to sync labels back to Gmail.
    res.json({ success: true, message: 'Label applied' });
  } catch (error) {
    next(error);
  }
});

export default router;
