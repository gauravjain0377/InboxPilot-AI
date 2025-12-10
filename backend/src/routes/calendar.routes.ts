import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getEvents,
  getFreeSlots,
  createEvent,
} from '../controllers/calendar.controller.js';

const router = Router();

router.use(authenticate);

router.get('/events', getEvents);
router.get('/free-slots', getFreeSlots);
router.post('/event', createEvent);
router.post('/suggest', async (req: any, res, next) => {
  try {
    const { emailBody } = req.body;
    const { CalendarService } = await import('../services/calendar.service.js');
    const { AIService } = await import('../services/ai.service.js');
    const { User } = await import('../models/User.js');
    
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const aiService = new AIService();
    const meetingDetails = await aiService.extractMeetingDetails(emailBody);
    
    if (meetingDetails.hasMeeting) {
      const calendarService = new CalendarService();
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const freeSlots = await calendarService.getFreeSlots(user, now, endDate, 30);
      
      res.json({
        success: true,
        hasMeeting: true,
        suggestedTimes: freeSlots.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
        })),
        attendees: meetingDetails.attendees,
      });
    } else {
      res.json({
        success: true,
        hasMeeting: false,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
