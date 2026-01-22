import cron from 'node-cron';
import { User } from '../models/User.js';
import { GmailService } from '../services/gmail.service.js';
import { Email } from '../models/Email.js';
import { Preferences } from '../models/Preferences.js';
import { RuleEngine } from '../services/ruleEngine.js';
import { logger } from '../utils/logger.js';

const gmailService = new GmailService();
const ruleEngine = new RuleEngine();

export const startEmailSyncCron = () => {
  // Cron job disabled - emails are now fetched directly from Gmail API
  // This eliminates MongoDB storage overhead for email content
  // Only AI metadata (summaries, classifications) are stored in MongoDB
  
  logger.info('Email sync cron job is disabled - emails are fetched directly from Gmail');
  
  // Optional: Run a lightweight cleanup job to remove old AI metadata
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running AI metadata cleanup...');
      
      // Clean up AI metadata older than 30 days that has no AI data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Email.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        aiSummary: { $exists: false },
        aiSuggestions: { $size: 0 },
      });
      
      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} old email metadata records`);
      }
    } catch (error) {
      logger.error('Error in metadata cleanup cron:', error);
    }
  });
  
  logger.info('AI metadata cleanup cron job started (runs daily at midnight)');
};

// Legacy function kept for reference - no longer stores full emails
async function syncUserEmails(user: any) {
  // This function is no longer used
  // Emails are fetched directly from Gmail API on demand
  logger.warn('syncUserEmails called but is deprecated - emails fetch directly from Gmail');
}
