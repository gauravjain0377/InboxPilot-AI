import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { AIService } from '../services/ai.service.js';
import { GmailService } from '../services/gmail.service.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import pdfParse from 'pdf-parse';

const aiService = new AIService();
const gmailService = new GmailService();

export const extractEmails = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { text } = req.body;
    let contentToParse = '';

    if (file) {
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        contentToParse = pdfData.text;
      } else {
        contentToParse = file.buffer.toString('utf-8');
      }
    } else if (text) {
      contentToParse = text;
    }

    if (!contentToParse) {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    // Extract emails using regex
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/gi;
    const extractedEmails = contentToParse.match(emailRegex) || [];
    
    // Remove duplicates
    const uniqueEmails = [...new Set(extractedEmails.map(e => e.toLowerCase()))];

    res.json({ emails: uniqueEmails });
  } catch (error: any) {
    logger.error('Error extracting emails:', error);
    res.status(500).json({ error: 'Failed to extract emails' });
  }
};

// Simple in-memory queue to handle batching (50-100 emails/hour)
// In a production environment, this should be Redis + BullMQ or similar.
interface QueueItem {
  userId: string;
  to: string;
  subject: string;
  body: string;
}

const campaignQueue: QueueItem[] = [];
let isQueueRunning = false;

const processQueue = async () => {
  if (isQueueRunning || campaignQueue.length === 0) return;
  isQueueRunning = true;

  try {
    while (campaignQueue.length > 0) {
      const batch = campaignQueue.splice(0, 50); // process 50 at a time
      
      for (const item of batch) {
        try {
          const user = await User.findById(item.userId);
          if (user) {
            await gmailService.sendMessage(user, item.to, item.subject, item.body);
            logger.info(`Campaign email sent to ${item.to}`);
          }
        } catch (err) {
          logger.error(`Failed to send campaign email to ${item.to}:`, err);
        }
        
        // Add a small delay between each email in the batch to avoid rate spikes
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (campaignQueue.length > 0) {
        logger.info(`Batch finished. Waiting 1 hour for next batch...`);
        // Wait 1 hour before next batch to respect limits
        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
      }
    }
  } catch (error) {
    logger.error('Error processing campaign queue:', error);
  } finally {
    isQueueRunning = false;
  }
};

export const startCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { emails, context, isPersonalized, subject, directBody, mode } = req.body;
    const userId = req.user?.userId;

    if (!userId || !emails || !emails.length || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (mode === 'direct' && !directBody) {
      return res.status(400).json({ error: 'Email body is required for direct send mode.' });
    }

    if (mode === 'ai' && !context) {
      return res.status(400).json({ error: 'Context is required for AI generate mode.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For AI mode, generate template once (non-personalized)
    let templateBody = '';
    if (mode === 'ai' && !isPersonalized) {
      templateBody = await aiService.generateCampaignEmail(context);
    }

    // Queue emails
    for (const email of emails) {
      let finalBody = '';

      if (mode === 'direct') {
        // Exact content, zero AI changes
        finalBody = directBody;
      } else if (isPersonalized) {
        // AI generates unique email per recipient
        finalBody = await aiService.generateCampaignEmail(`${context}\n\nRecipient email: ${email}`);
      } else {
        // AI generated once, send same to all
        finalBody = templateBody;
      }

      campaignQueue.push({ userId, to: email, subject, body: finalBody });
    }

    // Start processing queue in background
    processQueue();

    res.json({
      message: `Campaign launched! ${emails.length} email${emails.length > 1 ? 's' : ''} queued. Sending at 50/hour to keep your Gmail account safe.`,
      queueLength: campaignQueue.length
    });
  } catch (error: any) {
    logger.error('Error starting campaign:', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
};

