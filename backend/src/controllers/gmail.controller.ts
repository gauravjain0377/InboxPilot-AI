import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { GmailService } from '../services/gmail.service.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { Preferences } from '../models/Preferences.js';
import { RuleEngine } from '../services/ruleEngine.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

const gmailService = new GmailService();
const ruleEngine = new RuleEngine();

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const maxResults = parseInt(req.query.maxResults as string) || 50;
    const pageToken = req.query.pageToken as string | undefined;

    const { messages, nextPageToken } = await gmailService.getMessages(user, maxResults, pageToken);

    const emailDetails = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const emailData = await gmailService.getMessage(user, msg.id);
          return emailData;
        } catch (error) {
          logger.error(`Error fetching message ${msg.id}:`, error);
          return null;
        }
      })
    );

    const validEmails = emailDetails.filter((e) => e !== null);

    // Save emails to database with error handling
    for (const emailData of validEmails) {
      if (!emailData) continue;

      try {
        const existingEmail = await Email.findOne({ gmailId: emailData.id });
        if (existingEmail) continue;

        const preferences = await Preferences.findOne({ userId: user._id });
        const rules = preferences?.rules || [];
        const classification = ruleEngine.evaluateRules(rules, emailData);

        await Email.create({
          userId: user._id,
          gmailId: emailData.id,
          threadId: emailData.threadId,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          body: emailData.body,
          snippet: emailData.snippet,
          date: emailData.date,
          labels: emailData.labels,
          priority: classification.priority || 'medium',
          category: classification.category,
          isRead: emailData.isRead,
          isStarred: emailData.isStarred,
        });
      } catch (dbError: any) {
        // Log error but continue processing other emails
        logger.error(`Error saving email ${emailData.id} to database:`, dbError);
        // If it's a duplicate key error, that's fine - continue
        if (dbError.code !== 11000) {
          // Only log non-duplicate errors
          logger.warn(`Skipping email ${emailData.id} due to database error`);
        }
      }
    }

    const dbEmails = await Email.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(maxResults);

    res.json({ success: true, emails: dbEmails, nextPageToken });
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const email = await Email.findOne({ gmailId: req.params.id, userId: user._id });
    if (!email) throw new AppError('Email not found', 404);

    res.json({ success: true, email });
  } catch (error) {
    next(error);
  }
};

export const createDraft = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) throw new AppError('Missing required fields', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const draft = await gmailService.createDraft(user, to, subject, body);

    res.json({ success: true, draft });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) throw new AppError('Missing required fields', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const message = await gmailService.sendMessage(user, to, subject, body);

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const watchInbox = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topicName } = req.body;
    if (!topicName) throw new AppError('Topic name required', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const watch = await gmailService.watchInbox(user, topicName);

    res.json({ success: true, watch });
  } catch (error) {
    next(error);
  }
};

