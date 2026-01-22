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

    // Get user's preferences for rule evaluation
    const preferences = await Preferences.findOne({ userId: user._id });
    const rules = preferences?.rules || [];

    // Fetch email details directly from Gmail
    const emailDetails = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const emailData = await gmailService.getMessage(user, msg.id);
          
          // Get or create metadata record (stores metadata + AI data, NOT body content)
          let metadata = await Email.findOne({ gmailId: emailData.id, userId: user._id });
          
          if (!metadata) {
            // Evaluate rules for new emails
            const classification = ruleEngine.evaluateRules(rules, {
              from: emailData.from,
              to: emailData.to,
              subject: emailData.subject,
              snippet: emailData.snippet,
            });

            // Create metadata record (NO body stored - saves MongoDB space)
            try {
              metadata = await Email.create({
                userId: user._id,
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
                priority: classification.priority || 'medium',
                category: classification.category,
              });
            } catch (dbError: any) {
              // Ignore duplicate key errors
              if (dbError.code !== 11000) {
                logger.warn(`Could not save email metadata for ${emailData.id}`);
              }
            }
          } else {
            // Re-categorize existing emails that don't have a category yet
            let needsUpdate = false;
            const updateData: any = {
              labels: emailData.labels,
              isRead: emailData.isRead,
              isStarred: emailData.isStarred,
            };

            // If no category or priority is 'medium' (default), re-evaluate
            if (!metadata.category || metadata.priority === 'medium') {
              const classification = ruleEngine.evaluateRules(rules, {
                from: emailData.from,
                to: emailData.to,
                subject: emailData.subject,
                snippet: emailData.snippet,
              });

              if (classification.category && !metadata.category) {
                updateData.category = classification.category;
                metadata.category = classification.category;
                needsUpdate = true;
              }
              if (classification.priority && classification.priority !== 'medium') {
                updateData.priority = classification.priority;
                metadata.priority = classification.priority;
                needsUpdate = true;
              }
            }

            // Update status fields and category/priority if needed
            await Email.updateOne(
              { gmailId: emailData.id, userId: user._id },
              updateData
            );
          }
          
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
            // Include metadata from DB
            priority: metadata?.priority || 'medium',
            category: metadata?.category,
            aiSummary: metadata?.aiSummary,
            aiSuggestions: metadata?.aiSuggestions,
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

    // Update in Gmail
    await gmailService.markAsRead(user, req.params.id);
    
    // Update metadata for analytics
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

    // Update in Gmail
    await gmailService.markAsUnread(user, req.params.id);
    
    // Update metadata for analytics
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

    // Update in Gmail
    await gmailService.starMessage(user, req.params.id);
    
    // Update metadata for analytics
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

    // Update in Gmail
    await gmailService.unstarMessage(user, req.params.id);
    
    // Update metadata for analytics
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

