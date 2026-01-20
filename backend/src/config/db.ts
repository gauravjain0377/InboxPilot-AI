import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<boolean> => {
  try {
    // If no MongoDB URI is configured, skip connection
    if (!config.db.mongoUri || config.db.mongoUri.trim() === '') {
      logger.warn('MongoDB URI not configured. Running without database (extension mode).');
      return false;
    }

    await mongoose.connect(config.db.mongoUri);
    logger.info('MongoDB connected successfully');
    
    // Log connection details (without sensitive info)
    const uri = config.db.mongoUri;
    const dbName = uri.match(/\/([^?]+)/)?.[1] || 'default';
    logger.info(`Connected to database: ${dbName}`);
    
    return true;
  } catch (error: any) {
    logger.error('MongoDB connection error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('authentication failed')) {
      logger.error('MongoDB authentication failed. Check your username and password in MONGO_URI');
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      logger.error('MongoDB host not found. Check your MONGO_URI connection string');
    } else if (error.message?.includes('timeout')) {
      logger.error('MongoDB connection timeout. Check your network connection and MongoDB server status');
    } else {
      logger.error(`MongoDB error: ${error.message || 'Unknown error'}`);
    }
    
    logger.warn('Continuing without database connection');
    logger.warn('Login will fail with db_error until MongoDB is connected');
    return false;
  }
};

