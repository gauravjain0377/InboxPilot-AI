import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getMessages,
  getMessage,
  getFullMessage,
  getThread,
  createDraft,
  sendMessage,
  replyToMessage,
  markAsRead,
  markAsUnread,
  starMessage,
  unstarMessage,
  trashMessage,
  archiveMessage,
  getLabels,
  watchInbox,
} from '../controllers/gmail.controller.js';
import { Email } from '../models/Email.js';

const router = Router();

router.use(authenticate);

// Message retrieval
router.get('/messages', getMessages);
router.get('/message/:id', getMessage);
router.get('/message/:id/full', getFullMessage);
router.get('/thread/:threadId', getThread);
router.get('/labels', getLabels);

// Message actions
router.post('/draft', createDraft);
router.post('/send', sendMessage);
router.post('/message/:id/reply', replyToMessage);
router.post('/message/:id/read', markAsRead);
router.post('/message/:id/unread', markAsUnread);
router.post('/message/:id/star', starMessage);
router.post('/message/:id/unstar', unstarMessage);
router.post('/message/:id/trash', trashMessage);
router.post('/message/:id/archive', archiveMessage);

// Notifications
router.post('/watch', watchInbox);

// Legacy endpoint for extension compatibility
router.post('/apply-label', async (req: any, res, next) => {
  try {
    const { emailId, label, priority, category } = req.body;
    if (!emailId) {
      return res.status(400).json({ error: 'Email ID (thread or message) is required' });
    }
    
    const { User } = await import('../models/User.js');
    
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    try {
      const update: any = {};

      if (priority || category) {
        update.$set = {};
        if (priority) {
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
        await Email.updateMany(
          { userId: user._id, $or: [{ threadId: emailId }, { gmailId: emailId }] },
          update
        );
      }
    } catch (err) {
      console.error('Error updating Email document for apply-label:', err);
    }

    res.json({ success: true, message: 'Label applied' });
  } catch (error) {
    next(error);
  }
});

export default router;
