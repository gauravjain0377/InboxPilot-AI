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
  };
}
