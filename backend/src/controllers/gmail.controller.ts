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
    const label = req.query.label as string || 'INBOX';
    const labelIds = label === 'ALL' ? undefined : [label];

    const { messages, nextPageToken, resultSizeEstimate } = await gmailService.getMessages(user, maxResults, pageToken, labelIds);

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
        const existingEmail = await Email.findOne({ gmailId: emailData.id, userId: user._id });
        
        if (existingEmail) {
          // Update existing email with latest data
          await Email.updateOne(
            { gmailId: emailData.id, userId: user._id },
            {
              labels: emailData.labels,
              isRead: emailData.isRead,
              isStarred: emailData.isStarred,
            }
          );
          continue;
        }

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
        if (dbError.code !== 11000) {
          logger.warn(`Skipping email ${emailData.id} due to database error`);
        }
      }
    }

    // Return emails with body included
    const dbEmails = await Email.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(maxResults);

    res.json({ 
      success: true, 
      emails: dbEmails, 
      nextPageToken,
      totalEstimate: resultSizeEstimate 
    });
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // First try to get from database
    let email = await Email.findOne({ gmailId: req.params.id, userId: user._id });
    
    // If not in database or body is missing, fetch from Gmail
    if (!email || !email.body) {
      const gmailEmail = await gmailService.getMessage(user, req.params.id);
      
      if (email) {
        // Update existing email with body
        await Email.updateOne(
          { gmailId: req.params.id, userId: user._id },
          { body: gmailEmail.body }
        );
        email = await Email.findOne({ gmailId: req.params.id, userId: user._id });
      } else {
        // Return Gmail data directly
        res.json({ success: true, email: gmailEmail });
        return;
      }
    }

    // Mark as read in Gmail
    try {
      await gmailService.markAsRead(user, req.params.id);
      if (email) {
        await Email.updateOne(
          { gmailId: req.params.id, userId: user._id },
          { isRead: true }
        );
      }
    } catch (e) {
      logger.warn('Could not mark email as read:', e);
    }

    res.json({ success: true, email });
  } catch (error) {
    next(error);
  }
};

export const getFullMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Always fetch fresh from Gmail for full message
    const email = await gmailService.getMessage(user, req.params.id);
    
    res.json({ success: true, email });
  } catch (error) {
    next(error);
  }
};

export const getThread = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const thread = await gmailService.getThread(user, req.params.threadId);
    
    res.json({ success: true, thread });
  } catch (error) {
    next(error);
  }
};

export const createDraft = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, subject, body, threadId, inReplyTo, references } = req.body;
    if (!to || !subject || !body) throw new AppError('Missing required fields', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const draft = await gmailService.createDraft(user, to, subject, body, threadId, inReplyTo, references);

    res.json({ success: true, draft });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, subject, body, threadId, inReplyTo, references, cc, bcc } = req.body;
    if (!to || !subject || !body) throw new AppError('Missing required fields', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const message = await gmailService.sendMessage(user, to, subject, body, threadId, inReplyTo, references, cc, bcc);

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const replyToMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = req.body;
    const messageId = req.params.id;
    
    if (!body) throw new AppError('Reply body is required', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const message = await gmailService.replyToMessage(user, messageId, body);

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    await gmailService.markAsRead(user, req.params.id);
    await Email.updateOne(
      { gmailId: req.params.id, userId: user._id },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const markAsUnread = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    await gmailService.markAsUnread(user, req.params.id);
    await Email.updateOne(
      { gmailId: req.params.id, userId: user._id },
      { isRead: false }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const starMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    await gmailService.starMessage(user, req.params.id);
    await Email.updateOne(
      { gmailId: req.params.id, userId: user._id },
      { isStarred: true }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const unstarMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    await gmailService.unstarMessage(user, req.params.id);
    await Email.updateOne(
      { gmailId: req.params.id, userId: user._id },
      { isStarred: false }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const trashMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    await gmailService.trashMessage(user, req.params.id);
    await Email.deleteOne({ gmailId: req.params.id, userId: user._id });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const archiveMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    await gmailService.archiveMessage(user, req.params.id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getLabels = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const labels = await gmailService.getLabels(user);

    res.json({ success: true, labels });
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

