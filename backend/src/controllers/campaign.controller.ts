import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { AIService } from '../services/ai.service.js';
import { GmailService } from '../services/gmail.service.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

const aiService = new AIService();
const gmailService = new GmailService();

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// ─── Safe pdf-parse wrapper ───────────────────────────────────────────────────
// pdf-parse is CommonJS; require() at call-time avoids its startup file read bug
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err: any) {
    logger.warn('pdf-parse failed:', err.message);
    return '';
  }
}

// ─── Extract Emails Controller ────────────────────────────────────────────────
export const extractEmails = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { text } = req.body;

    let uniqueEmails: string[] = [];

    if (file) {
      const mime = file.mimetype;
      logger.info(`Processing uploaded file: ${file.originalname} (${mime}, ${file.size} bytes)`);

      // ─ Strategy 1: text extraction for PDFs ─
      if (mime === 'application/pdf') {
        const rawText = await extractTextFromPdf(file.buffer);
        if (rawText) {
          const found = rawText.match(EMAIL_REGEX) || [];
          uniqueEmails = [...new Set(found.map(e => e.toLowerCase()))];
          logger.info(`pdf-parse extracted ${uniqueEmails.length} emails from text layer`);
        }
      }

      // ─ Strategy 2: Gemini Vision for scanned PDFs / images ─
      // Triggered when: image file, OR pdf with no emails in text layer
      if (uniqueEmails.length === 0) {
        logger.info(`Falling back to Gemini Vision for ${mime}`);
        uniqueEmails = await aiService.extractEmailsFromFileVision(file.buffer, mime);
        logger.info(`Gemini Vision extracted ${uniqueEmails.length} emails`);
      }

      // ─ Strategy 3: raw buffer as UTF-8 text (txt, csv, etc.) ─
      if (uniqueEmails.length === 0 && !mime.startsWith('image/')) {
        const rawText = file.buffer.toString('utf-8');
        const found = rawText.match(EMAIL_REGEX) || [];
        uniqueEmails = [...new Set(found.map(e => e.toLowerCase()))];
        logger.info(`UTF-8 text fallback extracted ${uniqueEmails.length} emails`);
      }

    } else if (text) {
      const found = (text as string).match(EMAIL_REGEX) || [];
      uniqueEmails = [...new Set(found.map((e: string) => e.toLowerCase()))];
    } else {
      return res.status(400).json({ error: 'No file or text provided.' });
    }

    res.json({ emails: uniqueEmails });
  } catch (error: any) {
    logger.error('Error in extractEmails:', error);
    res.status(500).json({ error: 'Failed to extract emails: ' + (error.message || 'Unknown error') });
  }
};

// ─── Campaign Queue ───────────────────────────────────────────────────────────
interface QueueItem {
  userId: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: Buffer; mimeType: string }>;
}

const campaignQueue: QueueItem[] = [];
let isQueueRunning = false;

const processQueue = async () => {
  if (isQueueRunning || campaignQueue.length === 0) return;
  isQueueRunning = true;

  try {
    while (campaignQueue.length > 0) {
      const batch = campaignQueue.splice(0, 50);

      for (const item of batch) {
        try {
          const user = await User.findById(item.userId);
          if (user) {
            await gmailService.sendMessage(
              user, item.to, item.subject, item.body,
              undefined, undefined, undefined, undefined, undefined,
              item.attachments
            );
            logger.info(`Campaign email sent to ${item.to}`);
          }
        } catch (err) {
          logger.error(`Failed to send to ${item.to}:`, err);
        }
        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (campaignQueue.length > 0) {
        logger.info('Batch done. Waiting 1 hour for next batch...');
        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
      }
    }
  } catch (error) {
    logger.error('Queue processing error:', error);
  } finally {
    isQueueRunning = false;
  }
};

// ─── Start Campaign Controller ────────────────────────────────────────────────
export const startCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { emails, context, isPersonalized, subject, directBody, mode } = req.body;
    const userId = req.user?.userId;

    // emails comes as JSON string when using FormData
    let emailList: string[] = [];
    try {
      emailList = typeof emails === 'string' ? JSON.parse(emails) : (Array.isArray(emails) ? emails : []);
    } catch {
      emailList = [];
    }

    if (!userId || !emailList.length || !subject) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (mode === 'direct' && !directBody) {
      return res.status(400).json({ error: 'Email body is required for direct send.' });
    }
    if (mode === 'ai' && !context) {
      return res.status(400).json({ error: 'Context is required for AI mode.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Collect attachments — upload.fields() gives req.files as { fieldname: File[] }
    const attachments: Array<{ filename: string; content: Buffer; mimeType: string }> = [];
    const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFiles = filesMap?.['attachments'] || [];
    for (const f of uploadedFiles) {
      attachments.push({ filename: f.originalname, content: f.buffer, mimeType: f.mimetype });
      logger.info(`Attachment collected: ${f.originalname} (${f.mimetype}, ${f.size} bytes)`);
    }

    // Pre-generate AI template once if not personalized
    let templateBody = '';
    if (mode === 'ai' && !isPersonalized) {
      templateBody = await aiService.generateCampaignEmail(context);
    }

    for (const email of emailList) {
      let finalBody = '';

      if (mode === 'direct') {
        finalBody = directBody;
      } else if (isPersonalized) {
        finalBody = await aiService.generateCampaignEmail(`${context}\n\nRecipient: ${email}`);
      } else {
        finalBody = templateBody;
      }

      campaignQueue.push({
        userId,
        to: email,
        subject,
        body: finalBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    }

    processQueue();

    res.json({
      message: `Campaign launched! ${emailList.length} email${emailList.length > 1 ? 's' : ''} queued. Sending at 50/hour to keep your account safe.`,
      queueLength: campaignQueue.length,
    });
  } catch (error: any) {
    logger.error('Error starting campaign:', error);
    res.status(500).json({ error: 'Failed to start campaign: ' + (error.message || 'Unknown error') });
  }
};
