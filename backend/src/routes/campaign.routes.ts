import { Router } from 'express';
import multer from 'multer';
import { extractEmails, startCampaign } from '../controllers/campaign.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Memory storage — files go into req.file / req.files as buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
});

// Route: extract emails from a single uploaded file OR raw text
router.post('/extract-emails', authenticate, upload.single('file'), extractEmails);

// Route: start campaign — 'attachments' is the field name for multiple attached files
router.post(
  '/send',
  authenticate,
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  startCampaign
);

export default router;
