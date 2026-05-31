import { Router } from 'express';
import multer from 'multer';
import {
  extractEmails,
  parseCompanies,
  startCampaign,
  previewPersonalizedEmail,
  startPersonalizedCampaign,
} from '../controllers/campaign.controller.js';
import {
  saveTemplate,
  listTemplates,
  deleteTemplate,
  useTemplate,
} from '../controllers/template.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ─── Email extraction ─────────────────────────────────────────────────────────
router.post('/extract-emails', authenticate, upload.single('file'), extractEmails);
router.post('/parse-companies', authenticate, parseCompanies);

// ─── Campaign send ────────────────────────────────────────────────────────────
router.post('/send', authenticate, upload.fields([{ name: 'attachments', maxCount: 10 }]), startCampaign);
router.post('/send-personalized', authenticate, upload.fields([{ name: 'attachments', maxCount: 10 }]), startPersonalizedCampaign);

// ─── Preview ──────────────────────────────────────────────────────────────────
router.post('/preview-personalized', authenticate, previewPersonalizedEmail);

// ─── Template Library ─────────────────────────────────────────────────────────
router.post('/templates', authenticate, saveTemplate);
router.get('/templates', authenticate, listTemplates);
router.delete('/templates/:id', authenticate, deleteTemplate);
router.post('/templates/:id/use', authenticate, useTemplate);

export default router;
