export interface Email {
  _id?: string;
  gmailId: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body?: string;
  htmlBody?: string;
  snippet?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant?: boolean;
  isSent?: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  labels?: string[];
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  // AI metadata
  aiSummary?: string;
  aiSuggestions?: Array<{
    tone: string;
    draft: string;
    generatedAt: string;
  }>;
}

export type EmailTab = 'inbox' | 'sent' | 'starred';
