import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { FollowUp } from '../models/FollowUp.js';
import { ThreadState } from '../models/ThreadState.js';
import { AppError } from '../utils/errorHandler.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export const createFollowUpConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { threadId, messageId, to, subject, delays, delayDays, mode, tone, timeOfDay } = req.body;
    const userId = req.user?.userId;

    const normalizedDelays = Array.isArray(delays)
      ? delays
      : Number.isFinite(Number(delayDays))
      ? [Number(delayDays)]
      : [];

    const validDelays = normalizedDelays.filter((value: number) => Number.isFinite(value) && value > 0);

    if (!userId || !threadId || !messageId || !to || validDelays.length === 0) {
      throw new AppError('Missing required fields for follow-up config', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update or Create ThreadState
      await ThreadState.findOneAndUpdate(
        { userId, threadId },
        {
          userId,
          threadId,
          lastActivityTime: new Date(),
          hasReply: false,
          status: 'FOLLOW_UP_PENDING',
        },
        { upsert: true, new: true, session }
      );

      // Parse timeOfDay if provided, default to 09:00
      let targetHour = 9;
      let targetMinute = 0;
      if (timeOfDay && typeof timeOfDay === 'string' && timeOfDay.includes(':')) {
        const [hourString, minuteString] = timeOfDay.split(':');
        const h = parseInt(hourString, 10);
        const m = parseInt(minuteString, 10);
        if (!isNaN(h) && !isNaN(m)) {
          targetHour = h;
          targetMinute = m;
        }
      }

      // 2. Create FollowUps
      const followUpsToCreate = validDelays.map((delayValue: number, index: number) => {
        const scheduledTime = new Date();
        
        // Days are the only supported metric based on specs
        scheduledTime.setDate(scheduledTime.getDate() + delayValue);
        scheduledTime.setHours(targetHour, targetMinute, 0, 0);
        
        return {
          userId,
          threadId,
          messageId,
          to,
          subject,
          stepNumber: index + 1,
          delayDays: delayValue,
          scheduledTime,
          status: 'pending',
          mode: mode || 'hybrid',
          tone: tone || 'friendly',
        };
      });

      await FollowUp.insertMany(followUpsToCreate, { session });
      await session.commitTransaction();
      
      res.status(201).json({ success: true, message: 'Follow-ups scheduled' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

export const getFollowUps = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, threadId } = req.query;

    const query: any = { userId };
    if (status) query.status = status;
    if (threadId) query.threadId = threadId;

    const followUps = await FollowUp.find(query).sort({ scheduledTime: 1 });
    res.json({ success: true, followUps });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUpStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'pending_review', 'sent', 'cancelled', 'snoozed'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, userId },
      { status },
      { new: true }
    );

    if (!followUp) throw new AppError('FollowUp not found', 404);

    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUpDraft = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { draft } = req.body;

    if (!draft) throw new AppError('Draft content is required', 400);

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, userId },
      { draft },
      { new: true }
    );

    if (!followUp) throw new AppError('FollowUp not found', 404);

    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUpConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { mode, tone, scheduledTime, status, delayDays } = req.body;

    const followUp = await FollowUp.findOne({ _id: id, userId });
    if (!followUp) throw new AppError('FollowUp not found', 404);

    const updates: any = {};
    if (mode) updates.mode = mode;
    if (tone) updates.tone = tone;
    if (status) updates.status = status;

    if (Number.isFinite(Number(delayDays))) {
      const nextDelayDays = Number(delayDays);
      if (nextDelayDays < 1) {
        throw new AppError('delayDays must be greater than 0', 400);
      }

      updates.delayDays = nextDelayDays;

      if (!scheduledTime) {
        const autoScheduledTime = new Date();
        const existingTime = new Date(followUp.scheduledTime);
        autoScheduledTime.setDate(autoScheduledTime.getDate() + nextDelayDays);
        autoScheduledTime.setHours(existingTime.getHours(), existingTime.getMinutes(), 0, 0);
        updates.scheduledTime = autoScheduledTime;
      }
    }

    if (scheduledTime) {
      if (isNaN(new Date(scheduledTime).getTime())) {
        throw new AppError('Invalid scheduledTime format', 400);
      }
      updates.scheduledTime = new Date(scheduledTime);
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid fields provided for update', 400);
    }

    followUp.set(updates);
    await followUp.save();

    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};
