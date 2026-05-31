import { Response } from 'express';
import { Request } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { AIService } from '../services/ai.service.js';
import { GmailService } from '../services/gmail.service.js';
import { User } from '../models/User.js';
import { CampaignSend } from '../models/CampaignSend.js';
import { FollowUp } from '../models/FollowUp.js';
import { logger } from '../utils/logger.js';

// Multer-aware request type
interface MulterAuthRequest extends Request {
  user?: { userId: string; email: string };
  file?: any;
  files?: any;
}

const aiService = new AIService();
const gmailService = new GmailService();

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// ─── Safe pdf-parse wrapper ───────────────────────────────────────────────────
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

// ─── Extract domain from email ────────────────────────────────────────────────
function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

// ─── Extract Emails Controller ────────────────────────────────────────────────
export const extractEmails = async (req: MulterAuthRequest, res: Response) => {
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

      // ─ Strategy 2: Vision AI for scanned PDFs / images ─
      if (uniqueEmails.length === 0) {
        logger.info(`Falling back to Vision AI for ${mime}`);
        uniqueEmails = await aiService.extractEmailsFromFileVision(file.buffer, mime);
        logger.info(`Vision AI extracted ${uniqueEmails.length} emails`);
      }

      // ─ Strategy 3: raw buffer as UTF-8 text (txt, csv, etc.) ─
      if (uniqueEmails.length === 0 && !mime.startsWith('image/')) {
        const rawText = file.buffer.toString('utf-8');
        const found = rawText.match(EMAIL_REGEX) || [];
        uniqueEmails = [...new Set(found.map((e: string) => e.toLowerCase()))] as string[];
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

// ─── Parse Companies Controller ───────────────────────────────────────────────
export const parseCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'No text provided.' });
    }
    
    logger.info('Parsing companies from text...');
    const companies = await aiService.parseCompanyEmails(text);
    res.json({ companies });
  } catch (error: any) {
    logger.error('Error in parseCompanies:', error);
    res.status(500).json({ error: 'Failed to parse companies.' });
  }
};

// ─── Campaign Queue ───────────────────────────────────────────────────────────
interface QueueItem {
  userId: string;
  campaignId: string;
  to: string;
  companyName?: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: Buffer; mimeType: string }>;
  followUpEnabled?: boolean;
  followUpDelayDays?: number;
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
            const sent = await gmailService.sendMessage(
              user, item.to, item.subject, item.body,
              undefined, undefined, undefined, undefined, undefined,
              item.attachments
            );
            logger.info(`Campaign email sent to ${item.to}`);

            // ── Track the send ──────────────────────────────────────────────
            const sendRecord = await CampaignSend.create({
              userId: item.userId,
              campaignId: item.campaignId,
              to: item.to,
              companyName: item.companyName,
              subject: item.subject,
              sentAt: new Date(),
              gmailMessageId: sent?.id,
              gmailThreadId: sent?.threadId,
              followUpEnabled: item.followUpEnabled || false,
              followUpDelayDays: item.followUpDelayDays || 4,
              status: 'sent',
            });

            // ── Schedule follow-up if opted in ───────────────────────────────
            if (item.followUpEnabled && sent?.threadId && sent?.id) {
              const delayDays = item.followUpDelayDays || 4;
              const scheduledTime = new Date();
              scheduledTime.setDate(scheduledTime.getDate() + delayDays);

              await FollowUp.create({
                userId: item.userId,
                threadId: sent.threadId,
                messageId: sent.id,
                to: item.to,
                subject: `Re: ${item.subject}`,
                stepNumber: 1,
                delayDays,
                scheduledTime,
                status: 'pending',
                mode: 'auto',
                tone: 'friendly',
                draft: `Hi,\n\nJust following up on my previous email regarding the ${item.subject} position. I'd love to connect if you have a moment.\n\nBest,\n`,
              });
              logger.info(`Follow-up scheduled for ${item.to} in ${delayDays} days`);
            }
          }
        } catch (err) {
          logger.error(`Failed to send to ${item.to}:`, err);
        }
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

// ─── Start Campaign Controller (Direct / AI mode) ────────────────────────────
export const startCampaign = async (req: MulterAuthRequest, res: Response) => {
  try {
    const { emails, context, isPersonalized, subject, directBody, mode, followUpEnabled, followUpDelayDays } = req.body;
    const userId = req.user?.userId;
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
    const filesMap = (req.files as { [fieldname: string]: any[] }) || {};
    const uploadedFiles: any[] = filesMap['attachments'] || [];
    for (const f of uploadedFiles) {
      attachments.push({ filename: f.originalname, content: f.buffer, mimeType: f.mimetype });
      logger.info(`Attachment collected: ${f.originalname} (${f.mimetype}, ${f.size} bytes)`);
    }

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
        campaignId,
        to: email,
        subject,
        body: finalBody,
        attachments: attachments.length > 0 ? attachments : undefined,
        followUpEnabled: followUpEnabled === 'true' || followUpEnabled === true,
        followUpDelayDays: parseInt(followUpDelayDays || '4', 10),
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

// ─── Preview Single Personalized Email ───────────────────────────────────────
export const previewPersonalizedEmail = async (req: MulterAuthRequest, res: Response) => {
  try {
    const {
      companyName, recipientEmail, context, greeting,
      senderName, senderTitle, role, tone, senderSignature, extraNotes,
    } = req.body;

    if (!companyName || !recipientEmail || !context) {
      return res.status(400).json({ error: 'companyName, recipientEmail, and context are required.' });
    }

    const domain = extractDomain(recipientEmail);
    logger.info(`Generating preview for ${companyName} (${domain})`);

    const companyInfo = await aiService.fetchCompanyInfo(companyName, domain);
    const result = await aiService.generatePersonalizedCompanyEmail({
      companyName, companyInfo, recipientEmail,
      context: context || '',
      greeting: greeting || 'Hi',
      senderName: senderName || '',
      senderTitle: senderTitle || '',
      role: role || '',
      tone: tone || 'professional',
      senderSignature: senderSignature || senderName || '',
      extraNotes: extraNotes || '',
    });

    res.json({ subject: result.subject, body: result.body, companyInfo });
  } catch (error: any) {
    logger.error('Error generating preview:', error);
    res.status(500).json({ error: 'Preview generation failed: ' + (error.message || 'Unknown error') });
  }
};

// ─── Start Personalized Campaign (Company-specific) ───────────────────────────
export const startPersonalizedCampaign = async (req: MulterAuthRequest, res: Response) => {
  try {
    const {
      companies, context, greeting,
      senderName, senderTitle, senderSignature,
      role, tone, extraNotes, followUpEnabled, followUpDelayDays,
    } = req.body;

    const userId = req.user?.userId;
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    // Parse companies: [{ name: string, email: string }]
    let companyList: Array<{ name: string; email: string }> = [];
    try {
      companyList = typeof companies === 'string' ? JSON.parse(companies) : (Array.isArray(companies) ? companies : []);
    } catch {
      return res.status(400).json({ error: 'Invalid companies data.' });
    }

    if (!companyList.length) return res.status(400).json({ error: 'No companies provided.' });
    if (!context) return res.status(400).json({ error: 'Context is required.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Collect attachments
    const attachments: Array<{ filename: string; content: Buffer; mimeType: string }> = [];
    const filesMap = (req.files as { [fieldname: string]: any[] }) || {};
    const uploadedFiles: any[] = filesMap['attachments'] || [];
    for (const f of uploadedFiles) {
      attachments.push({ filename: f.originalname, content: f.buffer, mimeType: f.mimetype });
      logger.info(`Attachment for personalized campaign: ${f.originalname}`);
    }

    // Respond immediately — processing happens async
    res.json({
      message: `Personalized campaign launched! Researching ${companyList.length} companies and generating emails. Sending at 50/hour.`,
      total: companyList.length,
    });

    // Process in background
    (async () => {
      for (const company of companyList) {
        try {
          const domain = extractDomain(company.email);
          logger.info(`Researching ${company.name} (${domain})...`);

          const companyInfo = await aiService.fetchCompanyInfo(company.name, domain);
          const result = await aiService.generatePersonalizedCompanyEmail({
            companyName: company.name,
            companyInfo,
            recipientEmail: company.email,
            context: context || '',
            greeting: greeting || 'Hi',
            senderName: senderName || '',
            senderTitle: senderTitle || '',
            role: role || '',
            tone: tone || 'professional',
            senderSignature: senderSignature || senderName || '',
            extraNotes: extraNotes || '',
          });

          campaignQueue.push({
            userId,
            campaignId,
            to: company.email,
            companyName: company.name,
            subject: result.subject,
            body: result.body,
            attachments: attachments.length > 0 ? attachments : undefined,
            followUpEnabled: followUpEnabled === 'true' || followUpEnabled === true,
            followUpDelayDays: parseInt(followUpDelayDays || '4', 10),
          });

          logger.info(`Queued personalized email for ${company.name} (${company.email})`);

          // Start processing immediately so the first emails send while others are still generating
          processQueue();

          // Small delay between API calls to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err: any) {
          logger.error(`Failed to generate email for ${company.name}:`, err.message);
        }
      }

      logger.info(`All ${companyList.length} personalized emails generated.`);
    })();

  } catch (error: any) {
    logger.error('Error starting personalized campaign:', error);
    res.status(500).json({ error: 'Failed to start personalized campaign: ' + (error.message || 'Unknown error') });
  }
};
