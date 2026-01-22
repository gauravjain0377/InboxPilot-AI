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
  // Run every 15 minutes - sync email METADATA (not body content) for analytics
  cron.schedule('*/15 * * * *', async () => {
    try {
      logger.info('Starting email metadata sync...');
      
      // Get all users with Gmail access
      const users = await User.find({});
      logger.info(`Found ${users.length} users to sync`);
      
      for (const user of users) {
        try {
          await syncUserEmailMetadata(user);
        } catch (error: any) {
          logger.error(`Error syncing metadata for user ${user.email}:`, error);
          // Continue with other users
        }
      }
      
      logger.info('Email metadata sync completed');
    } catch (error) {
      logger.error('Error in email sync cron:', error);
    }
  });

  logger.info('Email metadata sync cron job started (runs every 15 minutes)');
  
  // Run a daily cleanup job to remove very old metadata
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running metadata cleanup...');
      
      // Clean up metadata older than 90 days that has no AI data
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await Email.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        aiSummary: { $exists: false },
        $or: [
          { aiSuggestions: { $exists: false } },
          { aiSuggestions: { $size: 0 } },
        ],
      });
      
      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} old email metadata records`);
      }
    } catch (error) {
      logger.error('Error in metadata cleanup cron:', error);
    }
  });
  
  logger.info('Metadata cleanup cron job started (runs daily at midnight)');
};

/**
 * Sync email metadata (NOT body content) for analytics and rules
 * This stores minimal data to keep MongoDB usage low while enabling analytics
 */
async function syncUserEmailMetadata(user: any) {
  try {
    // Fetch latest emails from Gmail
    const { messages } = await gmailService.getMessages(user, 50);
    
    if (!messages || messages.length === 0) {
      return;
    }

    // Get preferences for classification
    const preferences = await Preferences.findOne({ userId: user._id });
    const rules = preferences?.rules || [];

    // Process each email
    for (const msg of messages) {
      try {
        // Check if metadata already exists
        const existingEmail = await Email.findOne({ gmailId: msg.id, userId: user._id });
        
        // Fetch email details from Gmail
        const emailData = await gmailService.getMessage(user, msg.id);
        
        if (existingEmail) {
          // Update status fields only
          await Email.updateOne(
            { gmailId: msg.id, userId: user._id },
            {
              labels: emailData.labels,
              isRead: emailData.isRead,
              isStarred: emailData.isStarred,
            }
          );
          continue;
        }

        // Classify email with rules
        const classification = ruleEngine.evaluateRules(rules, {
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          snippet: emailData.snippet,
        });

        // Save METADATA only (NO body content - saves MongoDB space)
        await Email.create({
          userId: user._id,
          gmailId: emailData.id,
          threadId: emailData.threadId,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          snippet: emailData.snippet,
          date: emailData.date,
          labels: emailData.labels,
          isRead: emailData.isRead,
          isStarred: emailData.isStarred,
          isImportant: emailData.isImportant,
          isSent: emailData.isSent,
          priority: classification.priority || 'medium',
          category: classification.category,
        });

        logger.info(`Saved metadata for email ${emailData.id} (user: ${user.email})`);
      } catch (error: any) {
        // Ignore duplicate key errors
        if (error.code !== 11000) {
          logger.error(`Error processing email ${msg.id}:`, error);
        }
      }
    }
  } catch (error: any) {
    logger.error(`Error syncing metadata for user ${user.email}:`, error);
    throw error;
  }
}
