import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { CalendarService } from '../services/calendar.service.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';

const calendarService = new CalendarService();

export const getEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const timeMin = req.query.timeMin ? new Date(req.query.timeMin as string) : undefined;
    const timeMax = req.query.timeMax ? new Date(req.query.timeMax as string) : undefined;

    const events = await calendarService.getEvents(user, timeMin, timeMax);

    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

export const getFreeSlots = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, durationMinutes } = req.query;
    if (!startDate || !endDate) throw new AppError('Start and end dates required', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const slots = await calendarService.getFreeSlots(
      user,
      new Date(startDate as string),
      new Date(endDate as string),
      durationMinutes ? parseInt(durationMinutes as string) : 30
    );

    res.json({ success: true, slots });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { summary, startTime, endTime, attendees } = req.body;
    if (!summary || !startTime || !endTime) throw new AppError('Missing required fields', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const event = await calendarService.createEvent(
      user,
      summary,
      new Date(startTime),
      new Date(endTime),
      attendees
    );

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

