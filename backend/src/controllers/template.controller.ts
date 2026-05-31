import { Response } from 'express';
import { Request } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { CampaignTemplate } from '../models/CampaignTemplate.js';
import { logger } from '../utils/logger.js';

interface TemplateAuthRequest extends Request {
  user?: { userId: string; email: string };
}

// ─── Save Template ────────────────────────────────────────────────────────────
export const saveTemplate = async (req: TemplateAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const {
      name, mode, subject, body, context,
      greeting, senderName, senderTitle, senderSignature,
      role, tone, extraNotes,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Template name is required.' });
    if (!mode) return res.status(400).json({ error: 'Mode is required.' });

    const template = await CampaignTemplate.create({
      userId,
      name: name.trim(),
      mode,
      subject, body, context,
      greeting, senderName, senderTitle, senderSignature,
      role, tone, extraNotes,
    });

    logger.info(`Template saved: "${name}" (${mode}) for user ${userId}`);
    res.status(201).json({ template });
  } catch (error: any) {
    logger.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template.' });
  }
};

// ─── List Templates ───────────────────────────────────────────────────────────
export const listTemplates = async (req: TemplateAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const templates = await CampaignTemplate.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ templates });
  } catch (error: any) {
    logger.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates.' });
  }
};

// ─── Delete Template ──────────────────────────────────────────────────────────
export const deleteTemplate = async (req: TemplateAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const template = await CampaignTemplate.findOneAndDelete({ _id: id, userId });
    if (!template) return res.status(404).json({ error: 'Template not found.' });

    logger.info(`Template deleted: ${id} by user ${userId}`);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template.' });
  }
};

// ─── Use Template (increment usedCount) ──────────────────────────────────────
export const useTemplate = async (req: TemplateAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const template = await CampaignTemplate.findOneAndUpdate(
      { _id: id, userId },
      { $inc: { usedCount: 1 }, $set: { lastUsedAt: new Date() } },
      { new: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found.' });

    res.json({ template });
  } catch (error: any) {
    logger.error('Error using template:', error);
    res.status(500).json({ error: 'Failed to use template.' });
  }
};
