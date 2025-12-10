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

  async getMessages(user: IUser, maxResults: number = 50, pageToken?: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        pageToken,
      });

      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken,
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

  private parseMessage(message: any) {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const body = this.extractBody(message.payload);
    const snippet = message.snippet || '';

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader('from'),
      to: getHeader('to')?.split(',').map((e: string) => e.trim()) || [],
      cc: getHeader('cc')?.split(',').map((e: string) => e.trim()) || [],
      bcc: getHeader('bcc')?.split(',').map((e: string) => e.trim()) || [],
      subject: getHeader('subject'),
      body,
      snippet,
      date: new Date(parseInt(message.internalDate || '0')),
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED'),
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
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          return html.replace(/<[^>]*>/g, '').trim();
        }
        if (part.parts) {
          const nested = this.extractBody(part);
          if (nested) return nested;
        }
      }
    }

    return '';
  }

  async createDraft(user: IUser, to: string, subject: string, body: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n');

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating draft:', error);
      throw new Error(`Failed to create draft: ${error.message}`);
    }
  }

  async sendMessage(user: IUser, to: string, subject: string, body: string) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n');

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
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
}

