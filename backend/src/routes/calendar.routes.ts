import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.js';
import {
  getEvents,
  getFreeSlots,
  createEvent,
} from '../controllers/calendar.controller.js';

const router = Router();

router.get('/events', authenticate, getEvents);
router.get('/free-slots', authenticate, getFreeSlots);
router.post('/event', authenticate, createEvent);

// Suggest endpoint - optional auth for Gmail Add-on use
router.post('/suggest', optionalAuthenticate, async (req: any, res, next) => {
  try {
    const { emailBody } = req.body;
    if (!emailBody) {
      return res.status(400).json({ error: 'Email body required' });
    }
    
    const { AIService } = await import('../services/ai.service.js');
    const aiService = new AIService();
    const meetingDetails = await aiService.extractMeetingDetails(emailBody);
    
    if (meetingDetails.hasMeeting && req.user?.userId) {
      // If user is authenticated, get actual free slots
      const { CalendarService } = await import('../services/calendar.service.js');
      const { User } = await import('../models/User.js');
      const user = await User.findById(req.user.userId);
      
      if (user) {
        const calendarService = new CalendarService();
        const now = new Date();
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const freeSlots = await calendarService.getFreeSlots(user, now, endDate, 30);
        
        return res.json({
          success: true,
          hasMeeting: true,
          suggestedTimes: freeSlots.map(slot => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          })),
          attendees: meetingDetails.attendees,
        });
      }
    }
    
    // Return meeting details without calendar slots (for Gmail Add-on use without auth)
    res.json({
      success: true,
      hasMeeting: meetingDetails.hasMeeting || false,
      suggestedTimes: meetingDetails.suggestedTimes || [],
      attendees: meetingDetails.attendees || [],
      message: meetingDetails.hasMeeting ? 'Meeting detected. Sign in for calendar integration.' : 'No meeting request found.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
