import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

export class AIService {
  private gemini: GoogleGenerativeAI;
  private cachedModels: string[] | null = null;

  constructor() {
    if (!config.ai.geminiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in backend/.env file');
    }
    
    if (config.ai.geminiKey.trim().length === 0) {
      throw new Error('Gemini API key is empty. Please set GEMINI_API_KEY in backend/.env file');
    }
    
    // Basic validation - Gemini API keys usually start with "AIza"
    if (!config.ai.geminiKey.startsWith('AIza')) {
      logger.warn('Gemini API key format looks unusual. Please verify your API key is correct.');
    }
    
    this.gemini = new GoogleGenerativeAI(config.ai.geminiKey);
    logger.info('Gemini AI service initialized (using @google/generative-ai SDK)');
  }

  private async listAvailableModels(): Promise<string[]> {
    // Cache the models list to avoid repeated API calls
    if (this.cachedModels !== null) {
      return this.cachedModels;
    }

    try {
      // Use direct API call to list models (SDK doesn't have this method)
      const apiKey = (this.gemini as any).apiKey || config.ai.geminiKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as any;
        const modelNames = (data?.models || [])
          .map((m: any) => m.name?.replace('models/', '') || m.name)
          .filter((name: string) => name && name.includes('gemini'));
        
        logger.info('Available Gemini models:', modelNames);
        this.cachedModels = modelNames;
        return modelNames;
      }
    } catch (error: any) {
      logger.warn('Could not list available models, will use defaults:', error.message);
    }
    
    // Return empty array, will use fallback models
    this.cachedModels = [];
    return [];
  }

  private async generate(prompt: string): Promise<string> {
    // First, try to get list of available models
    const availableModels = await this.listAvailableModels();
    
    // Try free tier models - prioritize models that are actually available
    // If we got available models, use those; otherwise try common free tier names
    let modelsToTry: string[] = [];
    
    if (availableModels.length > 0) {
      // Filter for free tier models (pro or flash)
      modelsToTry = availableModels.filter(m => 
        m.includes('gemini') && (m.includes('pro') || m.includes('flash'))
      );
    }
    
    // Fallback to common free tier model names if no models found
    if (modelsToTry.length === 0) {
      modelsToTry = [
        'gemini-pro',           // Most common free tier model
        'gemini-1.5-flash',     // Flash model (faster, free tier)
        'gemini-1.0-pro',       // Alternative naming
      ];
    }

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        logger.info(`Attempting to use model: ${modelName}`);
        
        // Use SDK to generate content
        const model = this.gemini.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from model');
        }
        
        logger.info(`Successfully used model: ${modelName}`);
        return text.trim();
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        logger.warn(`Failed to use model ${modelName}:`, errorMsg);
        
        // If it's a 404, try next model
        if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('NotFound')) {
          continue;
        }
        
        // If it's authentication/authorization, don't try other models
        if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('Authentication') || errorMsg.includes('API key')) {
          break;
        }
      }
    }

    // If all models failed, provide helpful error message
    logger.error('AI generation error (Gemini): All models failed', lastError);
    
    const errorMsg = lastError?.message || String(lastError) || 'Unknown error';
    
    // Check if it's an API key issue
    if (errorMsg.includes('API key') || errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('Authentication') || errorMsg.includes('Invalid')) {
      throw new Error(`AI generation failed: Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in backend/.env file and ensure it's valid.`);
    }
    
    // Check if it's a quota issue
    if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      throw new Error(`AI generation failed: Free tier quota exceeded or rate limited. Please check your Gemini API usage limits.`);
    }
    
    // Check if models are not found
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      throw new Error(`AI generation failed: No available models found. Your API key might not have access to free tier models. Please verify your Gemini API key at https://makersuite.google.com/app/apikey and ensure the Generative Language API is enabled.`);
    }
    
    throw new Error(`AI generation failed: ${errorMsg}. Please check your Gemini API key configuration.`);
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

