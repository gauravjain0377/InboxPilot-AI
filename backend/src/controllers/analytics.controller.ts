import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { AIUsage } from '../models/AIUsage.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

interface AttentionDaySummary {
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  estimatedMinutes: number;
}

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    // Get email statistics with error handling
    let totalEmails = 0;
    let emailsWithAI = 0;
    let highPriorityEmails = 0;
    let unreadEmails = 0;
    let priorityBreakdown = { high: 0, medium: 0, low: 0 };
    let categoryStats: Array<{ name: string; count: number }> = [];
    let emailsOverTime: Array<{ date: string; count: number }> = [];
    let aiUsageBreakdown: Record<string, number> = {
      reply: 0,
      summarize: 0,
      rewrite: 0,
      followup: 0,
    };
    let timeSavedMinutes = 0;

    try {
      totalEmails = await Email.countDocuments({ userId: user._id });
      highPriorityEmails = await Email.countDocuments({ 
        userId: user._id, 
        priority: 'high' 
      });
      unreadEmails = await Email.countDocuments({ 
        userId: user._id, 
        isRead: false 
      });

      // Get emails by priority
      priorityBreakdown = {
        high: await Email.countDocuments({ userId: user._id, priority: 'high' }),
        medium: await Email.countDocuments({ userId: user._id, priority: 'medium' }),
        low: await Email.countDocuments({ userId: user._id, priority: 'low' }),
      };

      // Get emails by category
      const categoryAggregation = await Email.aggregate([
        { $match: { userId: user._id, category: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      categoryStats = categoryAggregation.map(cat => ({ name: cat._id, count: cat.count }));

      // Get emails over time (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const timeAggregation = await Email.aggregate([
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
      emailsOverTime = timeAggregation.map(item => ({ date: item._id, count: item.count }));

      // AI usage statistics (reply, summarize, rewrite, followup) from AIUsage collection
      const usageAggregation = await AIUsage.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]);

      for (const item of usageAggregation) {
        if (item?._id && typeof item.count === 'number') {
          aiUsageBreakdown[item._id] = item.count;
        }
      }

      // "AI Drafts" on dashboard = number of AI reply generations
      emailsWithAI = aiUsageBreakdown.reply || 0;

      // Estimate time saved using different weights per action (in minutes)
      // reply: ~5 min, summarize: ~2 min, rewrite: ~2 min, followup: ~3 min
      timeSavedMinutes =
        (aiUsageBreakdown.reply || 0) * 5 +
        (aiUsageBreakdown.summarize || 0) * 2 +
        (aiUsageBreakdown.rewrite || 0) * 2 +
        (aiUsageBreakdown.followup || 0) * 3;
    } catch (dbError) {
      logger.error('Error fetching email statistics:', dbError);
      // Continue with default values if database query fails
    }

    // Get user registration date
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      stats: {
        totalEmails,
        emailsWithAI,
        aiUsageBreakdown,
        highPriorityEmails,
        unreadEmails,
        timeSavedMinutes,
        accountAge,
        priorityBreakdown,
        categoryStats,
        emailsOverTime,
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

export const getAttentionOverview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // Look back 6 days plus today (last 7 days)
    const startOfRange = new Date(startOfToday.getTime());
    startOfRange.setDate(startOfToday.getDate() - 6);
    const endOfRange = new Date(startOfToday.getTime());

    const dailyMap: Record<string, AttentionDaySummary> = {};

    try {
      const unreadEmails = await Email.find({
        userId: user._id,
        isRead: false,
        date: { $gte: startOfRange, $lte: endOfRange }
      }).select('date priority snippet').lean();

      const readingWordsPerMinute = 180; // rough average reading speed

      for (const email of unreadEmails) {
        const date = new Date(email.date as Date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate()
        ).padStart(2, '0')}`;

        if (!dailyMap[key]) {
          dailyMap[key] = {
            date: key,
            total: 0,
            high: 0,
            medium: 0,
            low: 0,
            estimatedMinutes: 0,
          };
        }

        const bucket = dailyMap[key];
        const priority = (email as any).priority || 'medium';
        if (priority === 'high') bucket.high += 1;
        else if (priority === 'low') bucket.low += 1;
        else bucket.medium += 1;
        bucket.total += 1;

        const snippet = (email as any).snippet || '';
        const words = typeof snippet === 'string' ? snippet.trim().split(/\s+/).length : 0;
        const minutes = Math.max(1, Math.round(words / readingWordsPerMinute));
        bucket.estimatedMinutes += minutes;
      }
    } catch (err) {
      logger.error('Error computing attention overview:', err);
    }

    // Ensure we always return 7 days (today + next 6 days)
    const days: AttentionDaySummary[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfRange.getTime());
      d.setDate(startOfRange.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = dailyMap[key];
      if (existing) {
        days.push(existing);
      } else {
        days.push({
          date: key,
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          estimatedMinutes: 0,
        });
      }
    }

    const todayKey = `${startOfToday.getFullYear()}-${String(startOfToday.getMonth() + 1).padStart(2, '0')}-${String(
      startOfToday.getDate()
    ).padStart(2, '0')}`;
    const todaySummary = days.find((d) => d.date === todayKey) || {
      date: todayKey,
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      estimatedMinutes: 0,
    };

    res.json({
      success: true,
      attention: {
        today: todaySummary,
        days,
      },
    });
  } catch (error) {
    logger.error('Error fetching attention overview:', error);
    next(error);
  }
};

export const getDailyDigest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    try {
      const recentEmails = await Email.find({
        userId: user._id,
        date: { $gte: startOfDay },
      })
        .sort({ date: -1 })
        .limit(100)
        .lean();

      const priorityScore = (priority?: string) => {
        if (priority === 'high') return 3;
        if (priority === 'medium') return 2;
        if (priority === 'low') return 1;
        return 0;
      };

      const sorted = [...recentEmails].sort((a, b) => {
        const pa = priorityScore(a.priority);
        const pb = priorityScore(b.priority);
        if (pa !== pb) return pb - pa;
        return (b.date as Date).getTime() - (a.date as Date).getTime();
      });

      const top = sorted.slice(0, 10).map((email) => ({
        id: email._id,
        gmailId: email.gmailId,
        subject: email.subject,
        from: email.from,
        date: email.date,
        snippet: email.snippet,
        priority: email.priority,
        category: email.category,
        hasAiSuggestion: Array.isArray(email.aiSuggestions) && email.aiSuggestions.length > 0,
        hasSummary: Boolean(email.aiSummary && (email.aiSummary as string).length > 0),
      }));

      res.json({
        success: true,
        date: startOfDay,
        items: top,
      });
    } catch (err) {
      logger.error('Error building daily digest:', err);
      res.json({ success: false, items: [] });
    }
  } catch (error) {
    logger.error('Error in daily digest:', error);
    next(error);
  }
};

export const getRelationshipInsights = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      const contacts = await Email.aggregate([
        {
          $match: {
            userId: user._id,
            date: { $gte: ninetyDaysAgo },
          },
        },
        {
          $project: {
            from: 1,
            to: 1,
            cc: 1,
            bcc: 1,
            date: 1,
            subject: 1,
            category: 1,
            priority: 1,
            isFromMe: { $eq: ['$from', user.email] },
          },
        },
        {
          $addFields: {
            participants: {
              $setUnion: [
                ['$from'],
                { $ifNull: ['$to', []] },
                { $ifNull: ['$cc', []] },
                { $ifNull: ['$bcc', []] },
              ],
            },
          },
        },
        { $unwind: '$participants' },
        {
          $group: {
            _id: '$participants',
            totalEmails: { $sum: 1 },
            lastInteractionAt: { $max: '$date' },
            lastSubject: { $last: '$subject' },
            lastCategory: { $last: '$category' },
          },
        },
        { $sort: { lastInteractionAt: -1 } },
        { $limit: 30 },
      ]);

      const items = (contacts || [])
        .filter((c) => c._id && c._id !== user.email)
        .map((c) => ({
          contact: c._id as string,
          totalEmails: c.totalEmails as number,
          lastInteractionAt: c.lastInteractionAt as Date,
          lastSubject: c.lastSubject as string | undefined,
          lastCategory: c.lastCategory as string | undefined,
        }));

      res.json({
        success: true,
        relationships: {
          topContacts: items,
        },
      });
    } catch (err) {
      logger.error('Error computing relationship insights:', err);
      res.json({
        success: false,
        relationships: { topContacts: [] },
      });
    }
  } catch (error) {
    logger.error('Error in relationship insights:', error);
    next(error);
  }
};

export const getCommunicationInsights = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new AppError('User not found', 404);

    let totalSent = 0;
    let totalReceived = 0;
    let totalWordsSent = 0;
    const responseTimes: number[] = [];

    try {
      const [sentEmails, receivedEmails, usageAgg] = await Promise.all([
        Email.find({ userId: user._id, from: user.email }).select('date snippet threadId').lean(),
        Email.find({ userId: user._id, from: { $ne: user.email } }).select('date threadId').lean(),
        AIUsage.aggregate([
          { $match: { userId: user._id, action: 'reply' } },
          { $group: { _id: null, count: { $sum: 1 } } },
        ]),
      ]);

      totalSent = sentEmails.length;
      totalReceived = receivedEmails.length;

      // Approximate average reply length (words) from snippets (we don't store full bodies)
      for (const email of sentEmails) {
        const snippet = (email as any).snippet || '';
        const words = typeof snippet === 'string' ? snippet.trim().split(/\s+/).length : 0;
        totalWordsSent += words;
      }

      // Compute first-response times per thread (incoming -> first outgoing)
      const incomingByThread = new Map<string, Date>();
      for (const msg of receivedEmails) {
        const threadId = String((msg as any).threadId || '');
        if (!threadId) continue;
        const date = new Date(msg.date as Date);
        const existing = incomingByThread.get(threadId);
        if (!existing || date < existing) {
          incomingByThread.set(threadId, date);
        }
      }

      for (const msg of sentEmails) {
        const threadId = String((msg as any).threadId || '');
        if (!threadId) continue;
        const firstIncoming = incomingByThread.get(threadId);
        if (firstIncoming) {
          const sentDate = new Date(msg.date as Date);
          if (sentDate > firstIncoming) {
            const diffMs = sentDate.getTime() - firstIncoming.getTime();
            const minutes = diffMs / (1000 * 60);
            if (minutes >= 0) {
              responseTimes.push(minutes);
            }
          }
        }
      }

      let medianResponseMinutes: number | null = null;
      if (responseTimes.length > 0) {
        const sorted = responseTimes.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        medianResponseMinutes = Math.round(median);
      }

      const aiRepliesCount = Array.isArray(usageAgg) && usageAgg.length > 0 ? (usageAgg[0].count as number) : 0;
      const aiReplyRate = totalSent > 0 ? +(aiRepliesCount / totalSent).toFixed(2) : 0;

      const avgReplyLengthWords = totalSent > 0 ? Math.round(totalWordsSent / totalSent) : 0;

      res.json({
        success: true,
        communication: {
          totalSent,
          totalReceived,
          avgReplyLengthWords,
          medianResponseMinutes,
          aiReplyRate,
        },
      });
    } catch (err) {
      logger.error('Error computing communication insights:', err);
      res.json({
        success: false,
        communication: null,
      });
    }
  } catch (error) {
    logger.error('Error in communication insights:', error);
    next(error);
  }
};

