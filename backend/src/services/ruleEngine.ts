import { IRule } from '../models/Preferences.js';
import { IEmail } from '../models/Email.js';

// Category definitions with keywords and patterns
const CATEGORY_PATTERNS = {
  // Work-related categories
  'Work': {
    fromPatterns: ['@company.com', 'hr@', 'payroll@', 'admin@', 'team@'],
    subjectPatterns: ['meeting', 'project', 'deadline', 'report', 'review', 'task', 'assignment'],
    keywords: ['quarterly', 'sprint', 'standup', 'roadmap', 'deliverable']
  },
  'Task': {
    fromPatterns: ['jira', 'asana', 'trello', 'monday', 'notion', 'clickup', 'todoist', 'linear'],
    subjectPatterns: ['assigned', 'task', 'ticket', 'issue', 'bug', 'feature', 'todo', 'action required'],
    keywords: ['complete', 'due', 'deadline', 'blocked', 'in progress']
  },
  'Meeting': {
    fromPatterns: ['calendar', 'zoom', 'meet', 'teams', 'webex', 'calendly'],
    subjectPatterns: ['invitation', 'meeting', 'call', 'sync', 'standup', '1:1', 'conference', 'webinar'],
    keywords: ['join', 'scheduled', 'rescheduled', 'cancelled', 'updated invitation']
  },
  // Communication categories  
  'Reply Needed': {
    fromPatterns: [],
    subjectPatterns: ['re:', 'question', 'help', 'urgent', 'asap', 'need your', 'please respond'],
    keywords: ['waiting for your', 'let me know', 'thoughts?', 'feedback', 'your input']
  },
  'Newsletter': {
    fromPatterns: ['newsletter', 'digest', 'weekly', 'daily', 'substack', 'medium'],
    subjectPatterns: ['newsletter', 'digest', 'weekly', 'roundup', 'update', 'edition'],
    keywords: ['unsubscribe', 'view in browser', 'read more']
  },
  'Promotion': {
    fromPatterns: ['promo', 'deals', 'offer', 'marketing', 'sales', 'noreply'],
    subjectPatterns: ['sale', 'discount', 'offer', 'deal', 'off', 'save', 'free', 'limited time', 'exclusive'],
    keywords: ['shop now', 'buy now', 'order now', 'claim', 'coupon', 'promo code']
  },
  // Financial categories
  'Finance': {
    fromPatterns: ['bank', 'paypal', 'stripe', 'invoice', 'billing', 'payment'],
    subjectPatterns: ['invoice', 'payment', 'receipt', 'transaction', 'statement', 'balance', 'transfer'],
    keywords: ['paid', 'charged', 'refund', 'credit', 'debit']
  },
  // Social/Updates
  'Social': {
    fromPatterns: ['linkedin', 'twitter', 'facebook', 'instagram', 'github', 'slack', 'discord'],
    subjectPatterns: ['mentioned', 'tagged', 'commented', 'liked', 'followed', 'connection', 'message from'],
    keywords: ['notification', 'new follower', 'new message']
  },
  'Update': {
    fromPatterns: ['notification', 'alert', 'update', 'system'],
    subjectPatterns: ['update', 'notification', 'alert', 'changed', 'modified', 'new'],
    keywords: ['has been', 'was updated', 'changes to']
  },
  // Shipping/Orders
  'Shipping': {
    fromPatterns: ['shipping', 'delivery', 'fedex', 'ups', 'usps', 'dhl', 'amazon'],
    subjectPatterns: ['shipped', 'delivered', 'out for delivery', 'tracking', 'order', 'package'],
    keywords: ['tracking number', 'estimated delivery', 'on its way']
  }
};

// Priority patterns
const PRIORITY_PATTERNS = {
  high: {
    fromPatterns: ['ceo@', 'cto@', 'director@', 'manager@', 'urgent'],
    subjectPatterns: ['urgent', 'asap', 'critical', 'important', 'action required', 'immediate', 'emergency'],
    keywords: ['deadline today', 'by eod', 'p0', 'p1', 'blocker', 'critical']
  },
  low: {
    fromPatterns: ['noreply', 'no-reply', 'notification', 'newsletter', 'marketing'],
    subjectPatterns: ['newsletter', 'digest', 'weekly', 'fyi', 'update', 'automated', 'notification'],
    keywords: ['unsubscribe', 'view in browser', 'automated message', 'do not reply']
  }
};

export class RuleEngine {
  evaluateRules(rules: IRule[], email: Partial<IEmail>): {
    label?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  } {
    // First, check user-defined rules
    const activeRules = rules.filter((rule) => rule.isActive);
    for (const rule of activeRules) {
      if (this.matchesRule(rule, email)) {
        return rule.actions;
      }
    }

    // If no user rules match, apply smart auto-categorization
    return this.smartCategorize(email);
  }

  /**
   * Smart categorization based on email content patterns
   */
  private smartCategorize(email: Partial<IEmail>): {
    priority: 'low' | 'medium' | 'high';
    category?: string;
  } {
    const from = (email.from || '').toLowerCase();
    const subject = (email.subject || '').toLowerCase();
    const snippet = (email.snippet || '').toLowerCase();
    const content = `${subject} ${snippet}`;

    // Determine priority
    const priority = this.determinePriority(from, subject, content);

    // Determine category
    const category = this.determineCategory(from, subject, content);

    return { priority, category };
  }

  private determinePriority(from: string, subject: string, content: string): 'low' | 'medium' | 'high' {
    // Check for high priority
    const highPatterns = PRIORITY_PATTERNS.high;
    if (
      highPatterns.fromPatterns.some(p => from.includes(p)) ||
      highPatterns.subjectPatterns.some(p => subject.includes(p)) ||
      highPatterns.keywords.some(k => content.includes(k))
    ) {
      return 'high';
    }

    // Check for low priority
    const lowPatterns = PRIORITY_PATTERNS.low;
    if (
      lowPatterns.fromPatterns.some(p => from.includes(p)) ||
      lowPatterns.subjectPatterns.some(p => subject.includes(p)) ||
      lowPatterns.keywords.some(k => content.includes(k))
    ) {
      return 'low';
    }

    return 'medium';
  }

  private determineCategory(from: string, subject: string, content: string): string | undefined {
    let bestMatch: { category: string; score: number } | null = null;

    for (const [categoryName, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      let score = 0;

      // Check from patterns (highest weight)
      for (const pattern of patterns.fromPatterns) {
        if (from.includes(pattern)) {
          score += 3;
        }
      }

      // Check subject patterns (medium weight)
      for (const pattern of patterns.subjectPatterns) {
        if (subject.includes(pattern)) {
          score += 2;
        }
      }

      // Check content keywords (lower weight)
      for (const keyword of patterns.keywords) {
        if (content.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { category: categoryName, score };
      }
    }

    return bestMatch?.category;
  }

  private matchesRule(rule: IRule, email: Partial<IEmail>): boolean {
    return rule.conditions.every((condition) => {
      const fieldValue = this.getFieldValue(email, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private getFieldValue(email: Partial<IEmail>, field: string): string {
    switch (field) {
      case 'subject':
        return email.subject?.toLowerCase() || '';
      case 'body':
        // Use snippet as body content since IEmail doesn't have a body field
        return email.snippet?.toLowerCase() || '';
      case 'from':
        return email.from?.toLowerCase() || '';
      case 'to':
        return email.to?.join(' ').toLowerCase() || '';
      default:
        return '';
    }
  }

  private evaluateCondition(value: string, operator: string, expected: string): boolean {
    const lowerExpected = expected.toLowerCase();

    switch (operator) {
      case 'contains':
        return value.includes(lowerExpected);
      case 'equals':
        return value === lowerExpected;
      case 'startsWith':
        return value.startsWith(lowerExpected);
      case 'endsWith':
        return value.endsWith(lowerExpected);
      default:
        return false;
    }
  }
}

