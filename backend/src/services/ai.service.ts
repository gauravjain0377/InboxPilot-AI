import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

export class AIService {
  private gemini: GoogleGenerativeAI;

  constructor() {
    if (!config.ai.geminiKey) {
      throw new Error('Gemini API key not configured');
    }
    this.gemini = new GoogleGenerativeAI(config.ai.geminiKey);
  }

  private async generate(prompt: string): Promise<string> {
    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      logger.error('AI generation error (Gemini):', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async summarizeEmail(emailBody: string): Promise<string> {
    const prompt = `Summarize the following email in 2-3 sentences:\n\n${emailBody}`;
    return this.generate(prompt);
  }

  async generateReply(originalEmail: string, tone: Tone): Promise<string[]> {
    const toneInstructions: Record<Tone, string> = {
      formal: 'Write a formal, professional reply',
      friendly: 'Write a friendly, warm reply',
      assertive: 'Write a direct, assertive reply',
      short: 'Write a brief, concise reply (2-3 sentences)',
    };

    const prompt = `${toneInstructions[tone]}. Original email:\n\n${originalEmail}\n\nGenerate a reply:`;

    const reply = await this.generate(prompt);

    const variations: string[] = [reply];

    for (let i = 0; i < 2; i++) {
      const variationPrompt = `${prompt}\n\nGenerate a different variation:`;
      const variation = await this.generate(variationPrompt);
      variations.push(variation);
    }

    return variations;
  }

  async rewriteText(text: string, instruction: string): Promise<string> {
    const prompt = `Rewrite the following text: ${instruction}\n\nText:\n${text}`;
    return this.generate(prompt);
  }

  async generateFollowUp(originalEmail: string): Promise<string> {
    const prompt = `Generate a polite follow-up email for this conversation:\n\n${originalEmail}`;
    return this.generate(prompt);
  }

  async detectMeetingRequest(emailBody: string): Promise<boolean> {
    const prompt = `Does this email contain a meeting request or scheduling request? Answer only "yes" or "no":\n\n${emailBody}`;
    const response = await this.generate(prompt);
    return response.toLowerCase().includes('yes');
  }

  async extractMeetingDetails(emailBody: string): Promise<{
    hasMeeting: boolean;
    suggestedTimes?: string[];
    attendees?: string[];
  }> {
    const prompt = `Extract meeting details from this email. Return JSON with: hasMeeting (boolean), suggestedTimes (array of strings), attendees (array of email addresses):\n\n${emailBody}`;
    const response = await this.generate(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Failed to parse meeting details:', error);
    }

    return { hasMeeting: false };
  }
}

