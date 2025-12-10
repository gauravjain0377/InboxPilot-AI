import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { AIService } from '../services/ai.service.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { AppError } from '../utils/errorHandler.js';

const aiService = new AIService();

export const summarize = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, emailBody } = req.body;
    
    let emailContent: string;
    
    // Support both emailId (from database) and emailBody (from extension)
    if (emailBody) {
      emailContent = emailBody;
    } else if (emailId && req.user?.userId) {
      const user = await User.findById(req.user.userId);
      if (!user) throw new AppError('User not found', 404);

      const email = await Email.findOne({ _id: emailId, userId: user._id });
      if (!email) throw new AppError('Email not found', 404);
      
      emailContent = email.body;
      
      const summary = await aiService.summarizeEmail(emailContent);
      email.aiSummary = summary;
      await email.save();
      
      res.json({ success: true, summary });
      return;
    } else {
      throw new AppError('Email ID or email body required', 400);
    }

    const summary = await aiService.summarizeEmail(emailContent);
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

export const generateReply = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, emailBody, tone } = req.body;
    
    let emailContent: string;
    let user = null;
    
    // Support both emailId (from database) and emailBody (from extension)
    if (emailBody) {
      emailContent = emailBody;
    } else if (emailId && req.user?.userId) {
      user = await User.findById(req.user.userId);
      if (!user) throw new AppError('User not found', 404);

      const email = await Email.findOne({ _id: emailId, userId: user._id });
      if (!email) throw new AppError('Email not found', 404);
      
      emailContent = email.body;
      
      const selectedTone = tone || user.preferences?.defaultTone || 'friendly';
      const replies = await aiService.generateReply(emailContent, selectedTone);

      email.aiSuggestions = replies.map((draft) => ({
        tone: selectedTone,
        draft,
        generatedAt: new Date(),
      }));
      await email.save();

      res.json({ success: true, replies });
      return;
    } else {
      throw new AppError('Email ID or email body required', 400);
    }

    const selectedTone = tone || (user?.preferences?.defaultTone) || 'friendly';
    const replies = await aiService.generateReply(emailContent, selectedTone);
    res.json({ success: true, replies });
  } catch (error) {
    next(error);
  }
};

export const rewrite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, instruction } = req.body;
    if (!text || !instruction) throw new AppError('Text and instruction required', 400);

    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const rewritten = await aiService.rewriteText(text, instruction);

    res.json({ success: true, rewritten });
  } catch (error) {
    next(error);
  }
};

export const generateFollowUp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailId, emailBody } = req.body;
    
    let emailContent: string;
    
    // Support both emailId (from database) and emailBody (from extension)
    if (emailBody) {
      emailContent = emailBody;
    } else if (emailId && req.user?.userId) {
      const user = await User.findById(req.user.userId);
      if (!user) throw new AppError('User not found', 404);

      const email = await Email.findOne({ _id: emailId, userId: user._id });
      if (!email) throw new AppError('Email not found', 404);
      
      emailContent = email.body;
    } else {
      throw new AppError('Email ID or email body required', 400);
    }

    const followUp = await aiService.generateFollowUp(emailContent);
    res.json({ success: true, followUp });
  } catch (error) {
    next(error);
  }
};

