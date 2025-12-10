import cron from 'node-cron';
import { Reminder } from '../models/Reminder.js';
import { Email } from '../models/Email.js';
import { logger } from '../utils/logger.js';

export const startFollowUpCron = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const now = new Date();
      const reminders = await Reminder.find({
        followUpDate: { $lte: now },
        isCompleted: false,
      }).populate('userId');

      for (const reminder of reminders) {
        logger.info(`Processing follow-up reminder: ${reminder._id}`);
        await reminder.updateOne({ isCompleted: true });
      }

      logger.info(`Processed ${reminders.length} follow-up reminders`);
    } catch (error) {
      logger.error('Error processing follow-ups:', error);
    }
  });

  logger.info('Follow-up cron job started');
};

