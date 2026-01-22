export interface Email {
  _id: string;
  gmailId: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body?: string;
  htmlBody?: string;
  snippet?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  labels?: string[];
}

export type EmailTab = 'inbox' | 'sent' | 'starred';
