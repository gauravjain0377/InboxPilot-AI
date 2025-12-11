import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { AIService } from '../services/ai.service.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { AIUsage } from '../models/AIUsage.js';
import { GmailService } from '../services/gmail.service.js';
import { AppError } from '../utils/errorHandler.js';

const aiService = new AIService();
const gmailService = new GmailService();

export const verifyAPIKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const verification = await aiService.verifyAPIKey();
    res.json({
      success: verification.valid,
      valid: verification.valid,
      availableModels: verification.availableModels,
      error: verification.error,
      message: verification.valid 
        ? `API key is valid. Available models: ${verification.availableModels.join(', ') || 'default free tier models'}`
        : `API key verification failed: ${verification.error}`
    });
  } catch (error) {
    next(error);
  }
};

export const summarize = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, emailBody, subject, from } = req.body;

    if (!emailId && !emailBody) {
      throw new AppError('Email ID or email body required', 400);
    }

    let emailContent: string;
    let emailDoc: any = null;

    if (emailBody) {
      emailContent = emailBody;
    } else {
      if (!req.user?.userId) {
        throw new AppError('Authentication required when using emailId', 401);
      }

      const user = await User.findById(req.user.userId);
      if (!user) throw new AppError('User not found', 404);

      emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (!emailDoc) throw new AppError('Email not found', 404);

      // Fetch full content from Gmail API on demand (we don't store bodies)
      const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
    }

    const summary = await aiService.summarizeEmail(emailContent);

    // Persist summary on email when we have a DB email document
    if (emailDoc) {
      emailDoc.aiSummary = summary;
      await emailDoc.save();
    }

    // Log AI usage for analytics when we know the user
    if (req.user?.userId) {
      await AIUsage.create({
        userId: req.user.userId,
        action: 'summarize',
        source: emailBody ? 'extension' : 'web',
        emailId: emailDoc?._id,
        subjectSnippet: subject?.slice(0, 200),
        fromSnippet: from?.slice(0, 200),
      });
    }

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

export const generateReply = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, emailBody, tone, userContext, subject, from } = req.body;

    if (!emailId && !emailBody) {
      throw new AppError('Email ID or email body required', 400);
    }
    
    let emailContent: string;
    let user = null;
    let emailDoc: any = null;
    
    // Try to get user for signature (even if not authenticated, try to get from token)
    if (req.user?.userId) {
      user = await User.findById(req.user.userId);
    }
    
    // Support both emailId (from database) and emailBody (from extension)
    if (emailBody) {
      emailContent = emailBody;
    } else {
      if (!req.user?.userId || !user) {
        throw new AppError('User not found', 404);
      }

      emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (!emailDoc) throw new AppError('Email not found', 404);

      const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
    }

    // If user context is provided, prepend it to the email content for better context
    if (userContext && userContext.trim()) {
      emailContent = `User context/instructions: ${userContext.trim()}\n\nOriginal email:\n${emailContent}`;
    }

    const selectedTone = tone || (user?.preferences?.defaultTone) || 'friendly';
    const signature = user?.preferences?.signature || '';
    const replies = await aiService.generateReply(emailContent, selectedTone, signature);

    // When we have a DB email document, persist suggestions there
    if (emailDoc) {
      emailDoc.aiSuggestions = replies.map((draft) => ({
        tone: selectedTone,
        draft,
        generatedAt: new Date(),
      }));
      await emailDoc.save();
    }

    // Log AI usage for analytics when we know the user
    if (req.user?.userId) {
      const firstDraft = Array.isArray(replies) ? replies[0] : replies;
      await AIUsage.create({
        userId: req.user.userId,
        action: 'reply',
        source: emailBody ? 'extension' : 'web',
        emailId: emailDoc?._id,
        tone: selectedTone,
        subjectSnippet: subject?.slice(0, 200),
        fromSnippet: from?.slice(0, 200),
        draftLength: typeof firstDraft === 'string' ? firstDraft.length : undefined,
      });
    }

    res.json({ success: true, replies });
  } catch (error) {
    next(error);
  }
};

export const rewrite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, instruction, subject, from } = req.body;
    if (!text || !instruction) throw new AppError('Text and instruction required', 400);

    // Generate rewritten text (works with or without user)
    const rewritten = await aiService.rewriteText(text, instruction);

    // Log AI usage for analytics when we know the user
    if (req.user?.userId) {
      await AIUsage.create({
        userId: req.user.userId,
        action: 'rewrite',
        source: 'extension',
        subjectSnippet: subject?.slice(0, 200),
        fromSnippet: from?.slice(0, 200),
        draftLength: rewritten.length,
      });
    }

    res.json({ success: true, rewritten });
  } catch (error) {
    next(error);
  }
};

export const generateFollowUp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, emailBody, subject, from } = req.body;
    
    if (!emailId && !emailBody) {
      throw new AppError('Email ID or email body required', 400);
    }

    let emailContent: string;
    let emailDoc: any = null;
    
    // Support both emailId (from database) and emailBody (from extension)
    if (emailBody) {
      emailContent = emailBody;
    } else {
      if (!req.user?.userId) {
        throw new AppError('Authentication required when using emailId', 401);
      }

      const user = await User.findById(req.user.userId);
      if (!user) throw new AppError('User not found', 404);

      emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (!emailDoc) throw new AppError('Email not found', 404);

      const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
    }

    const followUp = await aiService.generateFollowUp(emailContent);

    // Log AI usage for analytics when we know the user
    if (req.user?.userId) {
      await AIUsage.create({
        userId: req.user.userId,
        action: 'followup',
        source: emailBody ? 'extension' : 'web',
        emailId: emailDoc?._id,
        subjectSnippet: subject?.slice(0, 200),
        fromSnippet: from?.slice(0, 200),
        draftLength: followUp.length,
      });
    }

    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};

