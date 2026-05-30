import { Router } from 'express';
import multer from 'multer';
import { extractEmails, startCampaign } from '../controllers/campaign.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route to extract emails from PDF or text
router.post('/extract-emails', authenticate, upload.single('file'), extractEmails);

// Route to start sending emails
router.post('/send', authenticate, startCampaign);

export default router;
