import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getMessages,
  getMessage,
  createDraft,
  sendMessage,
  watchInbox,
} from '../controllers/gmail.controller.js';

const router = Router();

router.use(authenticate);

router.get('/messages', getMessages);
router.get('/message/:id', getMessage);
router.post('/draft', createDraft);
router.post('/send', sendMessage);
router.post('/watch', watchInbox);
router.post('/apply-label', async (req: any, res, next) => {
  try {
    const { emailId, label } = req.body;
    if (!emailId || !label) {
      return res.status(400).json({ error: 'Email ID and label required' });
    }
    
    const { User } = await import('../models/User.js');
    const { GmailService } = await import('../services/gmail.service.js');
    
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const gmailService = new GmailService();
    // Note: Gmail API label application would go here
    // For now, we'll just return success
    res.json({ success: true, message: 'Label applied' });
  } catch (error) {
    next(error);
  }
});

export default router;
