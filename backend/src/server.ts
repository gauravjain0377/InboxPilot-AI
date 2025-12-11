import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './utils/errorHandler.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { logger } from './utils/logger.js';
import { startFollowUpCron } from './cron/followups.js';

import authRoutes from './routes/auth.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import aiRoutes from './routes/ai.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or Chrome extensions)
    if (!origin) return callback(null, true);
    
    // Allow localhost origins
    if (origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) {
      return callback(null, true);
    }
    
    // Allow Chrome extension origins
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    // Allow Gmail origin (for extension requests)
    if (origin.includes('mail.google.com')) {
      return callback(null, true);
    }
    
    // Default: allow all origins for development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit());

app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'InboxPilot API is running' });
});

app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'InboxPilot AI Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      gmail: '/api/gmail',
      ai: '/api/ai',
      calendar: '/api/calendar',
      analytics: '/api/analytics'
    }
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    // Try to connect to DB, but don't fail if it doesn't work
    const dbConnected = await connectDB();
    
    // Only start cron jobs if DB is connected
    if (dbConnected) {
      try {
        startFollowUpCron();
      } catch (error) {
        logger.warn('Failed to start cron jobs:', error);
      }
    }

    // Listen on 0.0.0.0 to accept connections from extensions and other sources
    app.listen(config.server.port, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${config.server.port}`);
      logger.info(`Server accessible at http://localhost:${config.server.port}`);
      if (!dbConnected) {
        logger.warn('Server running in extension mode (no database connection)');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

