export interface DashboardStats {
  totalEmails: number;
  emailsWithAI: number;
  highPriorityEmails: number;
  unreadEmails: number;
  timeSavedMinutes: number;
  accountAge: number;
  aiUsageBreakdown?: {
    reply: number;
    summarize: number;
    rewrite: number;
    followup: number;
  };
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  categoryStats: Array<{ name: string; count: number }>;
  emailsOverTime: Array<{ date: string; count: number }>;
  userInfo: {
    name: string;
    email: string;
    picture?: string;
    createdAt: string;
    preferences?: any;
    extensionConnected?: boolean;
  };
}

export interface AttentionDaySummary {
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  estimatedMinutes: number;
}

export interface AttentionOverview {
  today: AttentionDaySummary;
  days: AttentionDaySummary[];
}

export interface DailyDigestItem {
  id: string;
  gmailId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  priority?: string;
  category?: string;
  hasAiSuggestion: boolean;
  hasSummary: boolean;
}

export interface RelationshipSummary {
  contact: string;
  totalEmails: number;
  lastInteractionAt: string;
  lastSubject?: string;
  lastCategory?: string;
}

export interface CommunicationInsights {
  totalSent: number;
  totalReceived: number;
  avgReplyLengthWords: number;
  medianResponseMinutes: number | null;
  aiReplyRate: number;
}

