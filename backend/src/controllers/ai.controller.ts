import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { AIService } from '../services/ai.service.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { AIUsage } from '../models/AIUsage.js';
import { GmailService } from '../services/gmail.service.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

const aiService = new AIService();
const gmailService = new GmailService();

// Helper function to get user from request (supports both JWT and email auth from Gmail Add-on)
async function getUserFromRequest(req: AuthRequest | any): Promise<any> {
  // Try JWT authentication first (from website)
  if (req.user?.userId) {
    const user = await User.findById(req.user.userId);
    if (user) return user;
  }
  
  // Try email authentication (from Gmail Add-on)
  const { userEmail } = req.body;
  if (userEmail) {
    let user = await User.findOne({ email: userEmail });
    
    // Auto-register Gmail Add-on users if they don't exist
    if (!user) {
      logger.info(`Auto-registering Gmail Add-on user: ${userEmail}`);
      try {
        user = await User.create({
          email: userEmail,
          name: userEmail.split('@')[0], // Use email prefix as name
          // googleId, accessToken, refreshToken are optional for Gmail Add-on users
        });
        logger.info(`Successfully auto-registered user: ${userEmail}`);
      } catch (createError: any) {
        logger.error(`Failed to auto-register user ${userEmail}:`, createError);
        // If creation fails (e.g., duplicate), try to find again
        user = await User.findOne({ email: userEmail });
        if (!user) {
          throw new AppError(`Failed to register user. Please try again or register on the website first.`, 500);
        }
      }
    }
    return user;
  }
  
  throw new AppError('Authentication required. Please provide userEmail (for Gmail Add-on) or valid JWT token.', 401);
}

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

export const summarize = async (req: AuthRequest | any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, gmailId, emailBody, threadId, subject, from } = req.body;

    if (!emailId && !gmailId && !emailBody) {
      throw new AppError('Email ID, Gmail ID, or email body required', 400);
    }

    const user = await getUserFromRequest(req);
    let emailContent: string;
    let actualGmailId: string | null = null;
    let actualThreadId: string | null = threadId || null;

    if (emailBody) {
      // Direct content from Gmail Add-on or web
      emailContent = emailBody;
      actualGmailId = gmailId || null;
    } else if (gmailId) {
      // Fetch from Gmail using gmailId
      const fullMessage = await gmailService.getMessage(user, gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
      actualGmailId = gmailId;
      actualThreadId = fullMessage.threadId;
    } else {
      // Legacy: Try to find by _id in metadata
      const emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (emailDoc) {
        const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
        emailContent = fullMessage.body || fullMessage.snippet || '';
        actualGmailId = emailDoc.gmailId;
        actualThreadId = emailDoc.threadId;
      } else {
        throw new AppError('Email not found', 404);
      }
    }

    const summary = await aiService.summarizeEmail(emailContent);

    // Save AI metadata to lightweight model
    if (actualGmailId) {
      await Email.findOneAndUpdate(
        { gmailId: actualGmailId, userId: user._id },
        { 
          gmailId: actualGmailId,
          threadId: actualThreadId || actualGmailId,
          aiSummary: summary,
        },
        { upsert: true, new: true }
      );
    }

    await AIUsage.create({
      userId: user._id,
      action: 'summarize',
      source: emailBody ? 'addon' : 'web',
      subjectSnippet: subject?.slice(0, 200),
      fromSnippet: from?.slice(0, 200),
    });

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

export const generateReply = async (req: AuthRequest | any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, gmailId, emailBody, threadId, tone, userContext, subject, from } = req.body;

    if (!emailId && !gmailId && !emailBody) {
      throw new AppError('Email ID, Gmail ID, or email body required', 400);
    }
    
    const user = await getUserFromRequest(req);
    let emailContent: string;
    let actualGmailId: string | null = null;
    let actualThreadId: string | null = threadId || null;
    
    if (emailBody) {
      // Direct content from Gmail Add-on or web
      emailContent = emailBody;
      actualGmailId = gmailId || null;
    } else if (gmailId) {
      // Fetch from Gmail using gmailId
      const fullMessage = await gmailService.getMessage(user, gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
      actualGmailId = gmailId;
      actualThreadId = fullMessage.threadId;
    } else {
      // Legacy: Try to find by _id in metadata
      const emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (emailDoc) {
        const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
        emailContent = fullMessage.body || fullMessage.snippet || '';
        actualGmailId = emailDoc.gmailId;
        actualThreadId = emailDoc.threadId;
      } else {
        throw new AppError('Email not found', 404);
      }
    }

    if (userContext && userContext.trim()) {
      emailContent = `User context/instructions: ${userContext.trim()}\n\nOriginal email:\n${emailContent}`;
    }

    const selectedTone = tone || (user?.preferences?.defaultTone) || 'friendly';
    const signature = user?.preferences?.signature || '';
    const replies = await aiService.generateReply(emailContent, selectedTone, signature);

    // Save AI metadata to lightweight model
    if (actualGmailId) {
      await Email.findOneAndUpdate(
        { gmailId: actualGmailId, userId: user._id },
        { 
          gmailId: actualGmailId,
          threadId: actualThreadId || actualGmailId,
          aiSuggestions: replies.map((draft) => ({
            tone: selectedTone,
            draft,
            generatedAt: new Date(),
          })),
        },
        { upsert: true, new: true }
      );
    }

    const firstDraft = Array.isArray(replies) ? replies[0] : replies;
    await AIUsage.create({
      userId: user._id,
      action: 'reply',
      source: emailBody ? 'addon' : 'web',
      tone: selectedTone,
      subjectSnippet: subject?.slice(0, 200),
      fromSnippet: from?.slice(0, 200),
      draftLength: typeof firstDraft === 'string' ? firstDraft.length : undefined,
    });

    res.json({ success: true, replies });
  } catch (error) {
    next(error);
  }
};

export const rewrite = async (req: AuthRequest | any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, instruction, subject, from } = req.body;
    if (!text || !instruction) throw new AppError('Text and instruction required', 400);

    const user = await getUserFromRequest(req);
    const rewritten = await aiService.rewriteText(text, instruction);

    await AIUsage.create({
      userId: user._id,
      action: 'rewrite',
      source: 'addon',
      subjectSnippet: subject?.slice(0, 200),
      fromSnippet: from?.slice(0, 200),
      draftLength: rewritten.length,
    });

    res.json({ success: true, rewritten });
  } catch (error) {
    next(error);
  }
};

export const generateFollowUp = async (req: AuthRequest | any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, gmailId, emailBody, threadId, subject, from } = req.body;
    
    if (!emailId && !gmailId && !emailBody) {
      throw new AppError('Email ID, Gmail ID, or email body required', 400);
    }

    const user = await getUserFromRequest(req);
    let emailContent: string;
    let actualGmailId: string | null = null;
    let actualThreadId: string | null = threadId || null;
    
    if (emailBody) {
      // Direct content from Gmail Add-on or web
      emailContent = emailBody;
      actualGmailId = gmailId || null;
    } else if (gmailId) {
      // Fetch from Gmail using gmailId
      const fullMessage = await gmailService.getMessage(user, gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
      actualGmailId = gmailId;
      actualThreadId = fullMessage.threadId;
    } else {
      // Legacy: Try to find by _id in metadata
      const emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (emailDoc) {
        const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
        emailContent = fullMessage.body || fullMessage.snippet || '';
        actualGmailId = emailDoc.gmailId;
        actualThreadId = emailDoc.threadId;
      } else {
        throw new AppError('Email not found', 404);
      }
    }

    const followUp = await aiService.generateFollowUp(emailContent);

    await AIUsage.create({
      userId: user._id,
      action: 'followup',
      source: emailBody ? 'addon' : 'web',
      subjectSnippet: subject?.slice(0, 200),
      fromSnippet: from?.slice(0, 200),
      draftLength: followUp.length,
    });

    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};

