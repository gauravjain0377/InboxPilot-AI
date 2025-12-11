import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getDashboardStats } from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);

export default router;

