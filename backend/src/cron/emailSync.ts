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
  // Run every 15 minutes - automatically sync emails for all users
  cron.schedule('*/15 * * * *', async () => {
    try {
      logger.info('Starting automatic email sync...');
      
      // Get all users with Gmail access
      const users = await User.find({});
      logger.info(`Found ${users.length} users to sync`);
      
      for (const user of users) {
        try {
          await syncUserEmails(user);
        } catch (error: any) {
          logger.error(`Error syncing emails for user ${user.email}:`, error);
          // Continue with other users
        }
      }
      
      logger.info('Email sync completed');
    } catch (error) {
      logger.error('Error in email sync cron:', error);
    }
  });

  logger.info('Email sync cron job started (runs every 15 minutes)');
};

async function syncUserEmails(user: any) {
  try {
    // Fetch latest emails
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
        // Check if email already exists
        const existingEmail = await Email.findOne({ gmailId: msg.id });
        if (existingEmail) continue;

        // Fetch full email details
        const emailData = await gmailService.getMessage(user, msg.id);
        
        // Classify email with AI
        const classification = ruleEngine.evaluateRules(rules, emailData);

        // Save to database
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
          body: emailData.body,
          date: emailData.date,
          labels: emailData.labels,
          priority: classification.priority || 'medium',
          category: classification.category,
          isRead: emailData.isRead,
          isStarred: emailData.isStarred,
        });

        logger.info(`Saved email ${emailData.id} for user ${user.email}`);
      } catch (error: any) {
        logger.error(`Error processing email ${msg.id}:`, error);
      }
    }
  } catch (error: any) {
    logger.error(`Error syncing emails for user ${user.email}:`, error);
    throw error;
  }
}
