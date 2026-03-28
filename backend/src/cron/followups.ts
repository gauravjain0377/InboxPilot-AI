import cron from 'node-cron';
import { FollowUp } from '../models/FollowUp.js';
import { ThreadState } from '../models/ThreadState.js';
import { GmailService } from '../services/gmail.service.js';
import { AIService } from '../services/ai.service.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const gmailService = new GmailService();
const aiService = new AIService();

export const startFollowUpCron = () => {
  // In development: run every minute for fast testing
  // In production: run every hour
  const schedule = config.server.nodeEnv === 'development' ? '* * * * *' : '0 * * * *';
  cron.schedule(schedule, async () => {
    try {
      const now = new Date();
      logger.info('Checking for due follow-ups...');
      
      const dueFollowUps = await FollowUp.find({
        status: 'pending',
        scheduledTime: { $lte: now }
      });
      
      if (dueFollowUps.length === 0) {
        return;
      }
      
      logger.info(`Processing ${dueFollowUps.length} due follow-ups`);
      
      for (const followup of dueFollowUps) {
        try {
          const user = await User.findById(followup.userId);
          if (!user) continue;
          
          // Double check thread state
          const threadState = await ThreadState.findOne({ userId: user._id, threadId: followup.threadId });
          if (threadState && threadState.hasReply) {
            await followup.updateOne({ status: 'cancelled' });
            continue;
          }
          
          // Fetch original message context
          const originalMessage = await gmailService.getMessage(user, followup.messageId);
          const emailContext = originalMessage.body || originalMessage.snippet || '';
          
          // Determine if we should auto-send or need manual review
          const isManualPhase = followup.mode === 'manual' || (followup.mode === 'hybrid' && followup.stepNumber === 1);
          
          // Extract recipient name from the 'to' field (e.g. "John Doe <john@example.com>" -> "John Doe")
          let recipientName = '';
          if (Array.isArray(followup.to) && followup.to.length > 0) {
            const match = followup.to[0].match(/^([^<]+)/);
            if (match) {
              recipientName = match[1].trim().replace(/"/g, '');
            }
            if (recipientName.includes('@')) recipientName = ''; // If it's just an email, don't use it as a name
          }

          if (isManualPhase) {
            // Generate Draft and set to pending_review
            const draft = await aiService.generateFollowUp(emailContext, followup.stepNumber, followup.delayDays, followup.tone, user.name, recipientName);
            await followup.updateOne({ status: 'pending_review', draft });
            logger.info(`Draft generated for followup ${followup._id} (Pending Review)`);
          } else {
            // Auto Send
            const draft = followup.draft || await aiService.generateFollowUp(emailContext, followup.stepNumber, followup.delayDays, followup.tone, user.name, recipientName);
            
            await gmailService.replyToMessage(user, followup.messageId, draft);
            await followup.updateOne({ status: 'sent', draft });
            logger.info(`Auto-sent followup ${followup._id}`);
          }
        } catch (err: any) {
          logger.error(`Failed to process followup ${followup._id}:`, err);
        }
      }
    } catch (error) {
      logger.error('Error processing follow-ups:', error);
    }
  });

  logger.info('Follow-up cron job started');
};

