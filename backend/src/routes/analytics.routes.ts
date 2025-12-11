import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getDashboardStats,
  getAttentionOverview,
  getDailyDigest,
  getRelationshipInsights,
  getCommunicationInsights,
} from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/attention', getAttentionOverview);
router.get('/daily-digest', getDailyDigest);
router.get('/relationships', getRelationshipInsights);
router.get('/communication', getCommunicationInsights);

export default router;

