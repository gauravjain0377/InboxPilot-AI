import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { GmailService } from '../services/gmail.service.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

const gmailService = new GmailService();

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const maxResults = parseInt(req.query.maxResults as string) || 50;
    const pageToken = req.query.pageToken as string | undefined;
    const label = req.query.label as string || 'INBOX';
    const labelIds = label === 'ALL' ? undefined : [label];

    const { messages, nextPageToken, resultSizeEstimate } = await gmailService.getMessages(user, maxResults, pageToken, labelIds);

    // Fetch email details directly from Gmail - NO MongoDB storage
    const emailDetails = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const emailData = await gmailService.getMessage(user, msg.id);
          
          // Get AI metadata from DB if exists (lightweight - only stores AI data)
          const aiMetadata = await Email.findOne({ gmailId: emailData.id, userId: user._id })
            .select('priority category aiSummary aiSuggestions')
            .lean();
          
          return {
            gmailId: emailData.id,
            threadId: emailData.threadId,
            from: emailData.from,
            to: emailData.to,
            cc: emailData.cc,
            bcc: emailData.bcc,
            subject: emailData.subject,
            snippet: emailData.snippet,
            date: emailData.date,
            labels: emailData.labels,
            isRead: emailData.isRead,
            isStarred: emailData.isStarred,
            isImportant: emailData.isImportant,
            isSent: emailData.isSent,
            // Include AI metadata if available
            priority: aiMetadata?.priority || 'medium',
            category: aiMetadata?.category,
            aiSummary: aiMetadata?.aiSummary,
            aiSuggestions: aiMetadata?.aiSuggestions,
          };
        } catch (error) {
          logger.error(`Error fetching message ${msg.id}:`, error);
          return null;
        }
      })
    );

    const validEmails = emailDetails.filter((e) => e !== null);

    res.json({ 
      success: true, 
      emails: validEmails, 
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

    // Always fetch fresh from Gmail API - no MongoDB storage for email content
    const gmailEmail = await gmailService.getMessage(user, req.params.id);
    
    // Get AI metadata from DB if exists (lightweight)
    const aiMetadata = await Email.findOne({ gmailId: req.params.id, userId: user._id })
      .select('priority category aiSummary aiSuggestions')
      .lean();

    // Combine Gmail data with AI metadata
    const email = {
      gmailId: gmailEmail.id,
      threadId: gmailEmail.threadId,
      from: gmailEmail.from,
      to: gmailEmail.to,
      cc: gmailEmail.cc,
      bcc: gmailEmail.bcc,
      subject: gmailEmail.subject,
      body: gmailEmail.body,
      htmlBody: gmailEmail.htmlBody,
      snippet: gmailEmail.snippet,
      date: gmailEmail.date,
      labels: gmailEmail.labels,
      isRead: gmailEmail.isRead,
      isStarred: gmailEmail.isStarred,
      isImportant: gmailEmail.isImportant,
      isSent: gmailEmail.isSent,
      messageId: gmailEmail.messageId,
      inReplyTo: gmailEmail.inReplyTo,
      references: gmailEmail.references,
      // Include AI metadata if available
      priority: aiMetadata?.priority || 'medium',
      category: aiMetadata?.category,
      aiSummary: aiMetadata?.aiSummary,
      aiSuggestions: aiMetadata?.aiSuggestions,
    };

    // Mark as read in Gmail
    try {
      await gmailService.markAsRead(user, req.params.id);
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

    // Always fetch fresh from Gmail for full message with HTML
    const gmailEmail = await gmailService.getMessage(user, req.params.id);
    
    // Get AI metadata from DB if exists
    const aiMetadata = await Email.findOne({ gmailId: req.params.id, userId: user._id })
      .select('priority category aiSummary aiSuggestions')
      .lean();

    const email = {
      gmailId: gmailEmail.id,
      threadId: gmailEmail.threadId,
      from: gmailEmail.from,
      to: gmailEmail.to,
      cc: gmailEmail.cc,
      bcc: gmailEmail.bcc,
      subject: gmailEmail.subject,
      body: gmailEmail.body,
      htmlBody: gmailEmail.htmlBody,
      snippet: gmailEmail.snippet,
      date: gmailEmail.date,
      labels: gmailEmail.labels,
      isRead: gmailEmail.isRead,
      isStarred: gmailEmail.isStarred,
      isImportant: gmailEmail.isImportant,
      isSent: gmailEmail.isSent,
      messageId: gmailEmail.messageId,
      inReplyTo: gmailEmail.inReplyTo,
      references: gmailEmail.references,
      priority: aiMetadata?.priority || 'medium',
      category: aiMetadata?.category,
      aiSummary: aiMetadata?.aiSummary,
      aiSuggestions: aiMetadata?.aiSuggestions,
    };
    
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

    // Update directly in Gmail - no MongoDB storage needed
    await gmailService.markAsRead(user, req.params.id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const markAsUnread = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Update directly in Gmail - no MongoDB storage needed
    await gmailService.markAsUnread(user, req.params.id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const starMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Update directly in Gmail - no MongoDB storage needed
    await gmailService.starMessage(user, req.params.id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const unstarMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Update directly in Gmail - no MongoDB storage needed
    await gmailService.unstarMessage(user, req.params.id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const trashMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Update directly in Gmail - optionally delete AI metadata
    await gmailService.trashMessage(user, req.params.id);
    
    // Remove AI metadata if exists
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

