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
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new AppError('User not found. Please register on the website first.', 404);
    }
    return user;
  }
  
  throw new AppError('Authentication required', 401);
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
    const { emailId, emailBody, subject, from } = req.body;

    if (!emailId && !emailBody) {
      throw new AppError('Email ID or email body required', 400);
    }

    const user = await getUserFromRequest(req);
    let emailContent: string;
    let emailDoc: any = null;

    if (emailBody) {
      emailContent = emailBody;
    } else {
      emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (!emailDoc) throw new AppError('Email not found', 404);

      const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
    }

    const summary = await aiService.summarizeEmail(emailContent);

    if (emailDoc) {
      emailDoc.aiSummary = summary;
      await emailDoc.save();
    }

    await AIUsage.create({
      userId: user._id,
      action: 'summarize',
      source: emailBody ? 'addon' : 'web',
      emailId: emailDoc?._id,
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
    const { emailId, emailBody, tone, userContext, subject, from } = req.body;

    if (!emailId && !emailBody) {
      throw new AppError('Email ID or email body required', 400);
    }
    
    const user = await getUserFromRequest(req);
    let emailContent: string;
    let emailDoc: any = null;
    
    if (emailBody) {
      emailContent = emailBody;
    } else {
      emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (!emailDoc) throw new AppError('Email not found', 404);

      const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
    }

    if (userContext && userContext.trim()) {
      emailContent = `User context/instructions: ${userContext.trim()}\n\nOriginal email:\n${emailContent}`;
    }

    const selectedTone = tone || (user?.preferences?.defaultTone) || 'friendly';
    const signature = user?.preferences?.signature || '';
    const replies = await aiService.generateReply(emailContent, selectedTone, signature);

    if (emailDoc) {
      emailDoc.aiSuggestions = replies.map((draft) => ({
        tone: selectedTone,
        draft,
        generatedAt: new Date(),
      }));
      await emailDoc.save();
    }

    const firstDraft = Array.isArray(replies) ? replies[0] : replies;
    await AIUsage.create({
      userId: user._id,
      action: 'reply',
      source: emailBody ? 'addon' : 'web',
      emailId: emailDoc?._id,
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
    const { emailId, emailBody, subject, from } = req.body;
    
    if (!emailId && !emailBody) {
      throw new AppError('Email ID or email body required', 400);
    }

    const user = await getUserFromRequest(req);
    let emailContent: string;
    let emailDoc: any = null;
    
    if (emailBody) {
      emailContent = emailBody;
    } else {
      emailDoc = await Email.findOne({ _id: emailId, userId: user._id });
      if (!emailDoc) throw new AppError('Email not found', 404);

      const fullMessage = await gmailService.getMessage(user, emailDoc.gmailId);
      emailContent = fullMessage.body || fullMessage.snippet || '';
    }

    const followUp = await aiService.generateFollowUp(emailContent);

    await AIUsage.create({
      userId: user._id,
      action: 'followup',
      source: emailBody ? 'addon' : 'web',
      emailId: emailDoc?._id,
      subjectSnippet: subject?.slice(0, 200),
      fromSnippet: from?.slice(0, 200),
      draftLength: followUp.length,
    });

    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};

