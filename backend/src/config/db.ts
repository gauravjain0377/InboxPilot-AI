import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<boolean> => {
  try {
    // If no MongoDB URI is configured, skip connection (for extension-only mode)
    if (!config.db.mongoUri || config.db.mongoUri.trim() === '') {
      logger.warn('MongoDB URI not configured. Running without database (extension mode).');
      return false;
    }

    await mongoose.connect(config.db.mongoUri);
    logger.info('MongoDB connected successfully');
    return true;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.warn('Continuing without database connection (extension mode)');
    return false;
  }
};

