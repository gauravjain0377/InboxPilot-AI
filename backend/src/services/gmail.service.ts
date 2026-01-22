import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { decrypt } from '../utils/encrypt.js';
import { IUser } from '../models/User.js';
import { logger } from '../utils/logger.js';

export class GmailService {
  private getOAuth2Client(user: IUser): OAuth2Client {
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: decrypt(user.accessToken),
      refresh_token: decrypt(user.refreshToken),
    });

    return oauth2Client;
  }

  async getMessages(user: IUser, maxResults: number = 50, pageToken?: string, labelIds?: string[]) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        pageToken,
        labelIds: labelIds || ['INBOX'],
      });

      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate,
      };
    } catch (error: any) {
      logger.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  async getMessage(user: IUser, messageId: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseMessage(response.data);
    } catch (error: any) {
      logger.error('Error fetching message:', error);
      throw new Error(`Failed to fetch message: ${error.message}`);
    }
  }

  async getThread(user: IUser, threadId: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      const messages = (response.data.messages || []).map((msg: any) => this.parseMessage(msg));
      return {
        id: response.data.id,
        messages,
        snippet: response.data.snippet,
      };
    } catch (error: any) {
      logger.error('Error fetching thread:', error);
      throw new Error(`Failed to fetch thread: ${error.message}`);
    }
  }

  private parseMessage(message: any) {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const body = this.extractBody(message.payload);
    const htmlBody = this.extractHtmlBody(message.payload);
    const snippet = message.snippet || '';

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader('from'),
      to: getHeader('to')?.split(',').map((e: string) => e.trim()) || [],
      cc: getHeader('cc')?.split(',').map((e: string) => e.trim()) || [],
      bcc: getHeader('bcc')?.split(',').map((e: string) => e.trim()) || [],
      subject: getHeader('subject'),
      messageId: getHeader('message-id'),
      inReplyTo: getHeader('in-reply-to'),
      references: getHeader('references'),
      body,
      htmlBody,
      snippet,
      date: new Date(parseInt(message.internalDate || '0')),
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED'),
      isImportant: message.labelIds?.includes('IMPORTANT'),
      isSent: message.labelIds?.includes('SENT'),
      isDraft: message.labelIds?.includes('DRAFT'),
      isTrash: message.labelIds?.includes('TRASH'),
    };
  }

  private extractBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          const nested = this.extractBody(part);
          if (nested) return nested;
        }
      }
      // Fallback to HTML if no plain text
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    return '';
  }

  private extractHtmlBody(payload: any): string {
    if (payload.mimeType === 'text/html' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          const nested = this.extractHtmlBody(part);
          if (nested) return nested;
        }
      }
    }

    return '';
  }

  async createDraft(user: IUser, to: string, subject: string, body: string, threadId?: string, inReplyTo?: string, references?: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const headers = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
      ];

      if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
      if (references) headers.push(`References: ${references}`);

      const message = [...headers, '', body].join('\r\n');
      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const requestBody: any = {
        message: {
          raw: encodedMessage,
        },
      };

      if (threadId) requestBody.message.threadId = threadId;

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating draft:', error);
      throw new Error(`Failed to create draft: ${error.message}`);
    }
  }

  async sendMessage(user: IUser, to: string, subject: string, body: string, threadId?: string, inReplyTo?: string, references?: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Get user's email for From header
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const fromEmail = profile.data.emailAddress;

      const headers = [
        `From: ${fromEmail}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
      ];

      // Add reply headers if this is a reply (keeps email in same thread)
      if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
      if (references) headers.push(`References: ${references}`);

      const message = [...headers, '', body].join('\r\n');
      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const requestBody: any = {
        raw: encodedMessage,
      };

      // Include threadId to keep reply in the same conversation
      if (threadId) requestBody.threadId = threadId;

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody,
      });

      logger.info(`Email sent successfully: ${response.data.id}, thread: ${response.data.threadId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async replyToMessage(user: IUser, originalMessageId: string, body: string) {
    try {
      // Get the original message to extract reply headers
      const originalMessage = await this.getMessage(user, originalMessageId);
      
      // Build reply subject
      let subject = originalMessage.subject;
      if (!subject.toLowerCase().startsWith('re:')) {
        subject = `Re: ${subject}`;
      }

      // Build references header (includes all previous message IDs in thread)
      let references = originalMessage.references || '';
      if (originalMessage.messageId) {
        references = references ? `${references} ${originalMessage.messageId}` : originalMessage.messageId;
      }

      // Determine who to reply to
      const replyTo = this.extractEmailAddress(originalMessage.from);

      return this.sendMessage(
        user,
        replyTo,
        subject,
        body,
        originalMessage.threadId,
        originalMessage.messageId,
        references
      );
    } catch (error: any) {
      logger.error('Error replying to message:', error);
      throw new Error(`Failed to reply to message: ${error.message}`);
    }
  }

  private extractEmailAddress(fromHeader: string): string {
    // Extract email from "Name <email@example.com>" format
    const match = fromHeader.match(/<([^>]+)>/);
    return match ? match[1] : fromHeader;
  }

  async modifyLabels(user: IUser, messageId: string, addLabels: string[], removeLabels: string[]) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: addLabels,
          removeLabelIds: removeLabels,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error modifying labels:', error);
      throw new Error(`Failed to modify labels: ${error.message}`);
    }
  }

  async markAsRead(user: IUser, messageId: string) {
    return this.modifyLabels(user, messageId, [], ['UNREAD']);
  }

  async markAsUnread(user: IUser, messageId: string) {
    return this.modifyLabels(user, messageId, ['UNREAD'], []);
  }

  async starMessage(user: IUser, messageId: string) {
    return this.modifyLabels(user, messageId, ['STARRED'], []);
  }

  async unstarMessage(user: IUser, messageId: string) {
    return this.modifyLabels(user, messageId, [], ['STARRED']);
  }

  async trashMessage(user: IUser, messageId: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error trashing message:', error);
      throw new Error(`Failed to trash message: ${error.message}`);
    }
  }

  async archiveMessage(user: IUser, messageId: string) {
    return this.modifyLabels(user, messageId, [], ['INBOX']);
  }

  async watchInbox(user: IUser, topicName: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds: ['INBOX'],
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error watching inbox:', error);
      throw new Error(`Failed to watch inbox: ${error.message}`);
    }
  }

  async getLabels(user: IUser) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.labels.list({
        userId: 'me',
      });

      return response.data.labels || [];
    } catch (error: any) {
      logger.error('Error fetching labels:', error);
      throw new Error(`Failed to fetch labels: ${error.message}`);
    }
  }

  async getProfile(user: IUser) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.getProfile({
        userId: 'me',
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }
}

