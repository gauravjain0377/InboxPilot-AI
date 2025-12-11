import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Get email statistics
    const totalEmails = await Email.countDocuments({ userId: user._id });
    const emailsWithAI = await Email.countDocuments({ 
      userId: user._id, 
      aiSuggestions: { $exists: true, $ne: [] } 
    });
    const highPriorityEmails = await Email.countDocuments({ 
      userId: user._id, 
      priority: 'high' 
    });
    const unreadEmails = await Email.countDocuments({ 
      userId: user._id, 
      isRead: false 
    });

    // Get emails by priority
    const priorityBreakdown = {
      high: await Email.countDocuments({ userId: user._id, priority: 'high' }),
      medium: await Email.countDocuments({ userId: user._id, priority: 'medium' }),
      low: await Email.countDocuments({ userId: user._id, priority: 'low' }),
    };

    // Get emails by category
    const categoryStats = await Email.aggregate([
      { $match: { userId: user._id, category: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get emails over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const emailsOverTime = await Email.aggregate([
      { 
        $match: { 
          userId: user._id,
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate time saved (estimate: 5 minutes per AI-generated draft)
    const timeSavedMinutes = emailsWithAI * 5;

    // Get user registration date
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      stats: {
        totalEmails,
        emailsWithAI,
        highPriorityEmails,
        unreadEmails,
        timeSavedMinutes,
        accountAge,
        priorityBreakdown,
        categoryStats: categoryStats.map(cat => ({ name: cat._id, count: cat.count })),
        emailsOverTime: emailsOverTime.map(item => ({ date: item._id, count: item.count })),
        userInfo: {
          name: user.name,
          email: user.email,
          picture: user.picture,
          createdAt: user.createdAt,
          preferences: user.preferences,
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

