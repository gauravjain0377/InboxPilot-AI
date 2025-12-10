import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { decrypt } from '../utils/encrypt.js';
import { IUser } from '../models/User.js';
import { logger } from '../utils/logger.js';

export class CalendarService {
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

  async getEvents(user: IUser, timeMin?: Date, timeMax?: Date) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error: any) {
      logger.error('Error fetching calendar events:', error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
  }

  async getFreeSlots(user: IUser, startDate: Date, endDate: Date, durationMinutes: number = 30) {
    try {
      const events = await this.getEvents(user, startDate, endDate);
      const busySlots: Array<{ start: Date; end: Date }> = [];

      events.forEach((event: any) => {
        if (event.start?.dateTime && event.end?.dateTime) {
          busySlots.push({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime),
          });
        }
      });

      const freeSlots: Array<{ start: Date; end: Date }> = [];
      let current = new Date(startDate);

      while (current < endDate) {
        const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
        const isBusy = busySlots.some(
          (busy) => (current >= busy.start && current < busy.end) || (slotEnd > busy.start && slotEnd <= busy.end)
        );

        if (!isBusy && slotEnd <= endDate) {
          freeSlots.push({ start: new Date(current), end: new Date(slotEnd) });
        }

        current = new Date(current.getTime() + 30 * 60000);
      }

      return freeSlots;
    } catch (error: any) {
      logger.error('Error getting free slots:', error);
      throw new Error(`Failed to get free slots: ${error.message}`);
    }
  }

  async createEvent(user: IUser, summary: string, startTime: Date, endTime: Date, attendees?: string[]) {
    try {
      const oauth2Client = this.getOAuth2Client(user);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          attendees: attendees?.map((email) => ({ email })),
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating calendar event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }
}

