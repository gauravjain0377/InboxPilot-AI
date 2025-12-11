import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private cachedModels: string[] | null = null;
  private geminiInitialized: boolean = false;
  private initializationError: string | null = null;

  constructor() {
    try {
      if (!config.ai.geminiKey || config.ai.geminiKey.trim().length === 0) {
        this.initializationError = 'Gemini API key not configured. Please set GEMINI_API_KEY in backend/.env file';
        logger.warn(this.initializationError);
        return;
      }
      
      // Basic validation - Gemini API keys usually start with "AIza"
      if (!config.ai.geminiKey.startsWith('AIza')) {
        logger.warn('Gemini API key format looks unusual. Please verify your API key is correct.');
        logger.warn('Valid Gemini API keys start with "AIza". Get a free key at https://makersuite.google.com/app/apikey');
      }
      
      this.gemini = new GoogleGenerativeAI(config.ai.geminiKey);
      this.geminiInitialized = true;
      logger.info('Gemini AI service initialized (using @google/generative-ai SDK)');
      
      // Verify API key asynchronously (don't block initialization)
      this.verifyAPIKey().then(result => {
        if (result.valid) {
          logger.info(`Gemini API key verified. Available models: ${result.availableModels.join(', ') || 'default free tier models'}`);
        } else {
          logger.warn(`Gemini API key verification failed: ${result.error}`);
          logger.warn('Please verify your API key at https://makersuite.google.com/app/apikey');
        }
      }).catch(err => {
        logger.warn('Could not verify Gemini API key on startup:', err.message);
      });
    } catch (error: any) {
      this.initializationError = error.message || 'Failed to initialize Gemini AI service';
      logger.error('Gemini AI service initialization error:', error);
    }
  }

  async verifyAPIKey(): Promise<{ valid: boolean; availableModels: string[]; error?: string }> {
    if (!this.gemini || !config.ai.geminiKey) {
      return { valid: false, availableModels: [], error: 'Gemini API key not configured' };
    }

    try {
      // Use direct API call to list models and verify key
      const apiKey = config.ai.geminiKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as any;
        const modelNames = (data?.models || [])
          .map((m: any) => m.name?.replace('models/', '') || m.name)
          .filter((name: string) => name && name.includes('gemini'));
        
        logger.info('Available Gemini models:', modelNames);
        this.cachedModels = modelNames;
        return { valid: true, availableModels: modelNames };
      } else {
        const errorText = await response.text();
        return { 
          valid: false, 
          availableModels: [], 
          error: `API key verification failed: ${response.status} ${errorText}` 
        };
      }
    } catch (error: any) {
      logger.error('API key verification error:', error);
      return { 
        valid: false, 
        availableModels: [], 
        error: error.message || 'Failed to verify API key' 
      };
    }
  }

  private async listAvailableModels(): Promise<string[]> {
    if (!this.gemini) {
      return [];
    }

    // Cache the models list to avoid repeated API calls
    if (this.cachedModels !== null) {
      return this.cachedModels;
    }

    try {
      const verification = await this.verifyAPIKey();
      if (verification.valid) {
        return verification.availableModels;
      }
    } catch (error: any) {
      logger.warn('Could not list available models, will use defaults:', error.message);
    }
    
    // Return empty array, will use fallback models
    this.cachedModels = [];
    return [];
  }

  private async generate(prompt: string): Promise<string> {
    if (!this.geminiInitialized || this.initializationError) {
      throw new Error(this.initializationError || 'Gemini AI service not initialized. Please check your GEMINI_API_KEY in backend/.env file');
    }

    if (!this.gemini) {
      throw new Error(this.initializationError || 'Gemini AI service not initialized');
    }

    // Free tier models only - try in order of preference
    // These are the official free tier model names from Google
    // Try to get available models first, but don't wait if it fails
    let modelsToTry = [
      'gemini-1.5-flash',        // Primary free tier model (fastest)
      'gemini-1.5-flash-8b',     // Faster variant (if available)
      'gemini-1.5-pro',          // Free tier pro model (slower but more capable)
      'gemini-pro',              // Legacy free tier model
    ];

    // If we have cached models, prioritize those
    if (this.cachedModels && this.cachedModels.length > 0) {
      // Filter to only free tier models we know about
      const availableFreeTier = this.cachedModels.filter(m => 
        m.includes('flash') || m.includes('pro')
      );
      if (availableFreeTier.length > 0) {
        modelsToTry = [...availableFreeTier, ...modelsToTry.filter(m => !availableFreeTier.includes(m))];
      }
    }

    let lastError: any = null;
    const errors: string[] = [];

    for (const modelName of modelsToTry) {
      try {
        logger.info(`Trying Gemini model: ${modelName}`);
        
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
        const errorDetails = error?.errorDetails || error?.status || '';
        errors.push(`${modelName}: ${errorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
        
        logger.warn(`Model ${modelName} failed:`, errorMsg);
        
        // If it's a 404 or model not found, try next model
        if (errorMsg.includes('404') || 
            errorMsg.includes('not found') || 
            errorMsg.includes('NotFound') ||
            errorMsg.includes('Model') && errorMsg.includes('not found')) {
          continue;
        }
        
        // If it's authentication/authorization, don't try other models
        if (errorMsg.includes('401') || 
            errorMsg.includes('403') || 
            errorMsg.includes('Authentication') || 
            errorMsg.includes('API key') ||
            errorMsg.includes('PERMISSION_DENIED') ||
            errorMsg.includes('INVALID_ARGUMENT') && errorMsg.includes('API key')) {
          logger.error('Authentication error detected, stopping model attempts');
          break;
        }
        
        // For quota/rate limit errors, try next model (might be model-specific)
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          logger.warn(`Rate limit on ${modelName}, trying next model`);
          continue;
        }
        
        // For other errors, log and try next model
        continue;
      }
    }

    // If all models failed, provide detailed error message
    const errorMsg = lastError?.message || String(lastError) || 'Unknown error';
    logger.error('All Gemini models failed. Errors:', errors);
    
    // Check if it's an API key issue
    if (errorMsg.includes('API key') || 
        errorMsg.includes('401') || 
        errorMsg.includes('403') || 
        errorMsg.includes('Authentication') || 
        errorMsg.includes('Invalid') ||
        errorMsg.includes('PERMISSION_DENIED')) {
      throw new Error(`AI generation failed: Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in backend/.env file. Get a free API key at https://makersuite.google.com/app/apikey`);
    }
    
    // Check if it's a quota issue
    if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      throw new Error(`AI generation failed: Free tier quota exceeded or rate limited. Please check your Gemini API usage limits at https://makersuite.google.com/app/apikey`);
    }
    
    // Check if models are not found - provide specific instructions
    if (errorMsg.includes('404') || errorMsg.includes('not found') || errors.some(e => e.includes('404'))) {
      throw new Error(`AI generation failed: No free tier models available. Please verify:\n1. Your Gemini API key is valid (get one at https://makersuite.google.com/app/apikey)\n2. The Generative Language API is enabled in Google Cloud Console\n3. Your API key has access to free tier models\n\nErrors: ${errors.join('; ')}`);
    }
    
    throw new Error(`AI generation failed: ${errorMsg}\n\nTried models: ${modelsToTry.join(', ')}\nErrors: ${errors.join('; ')}\n\nPlease verify your GEMINI_API_KEY in backend/.env is correct and get a free API key at https://makersuite.google.com/app/apikey`);
  }

  async summarizeEmail(emailBody: string): Promise<string> {
    // Truncate email body if too long for faster processing
    const truncatedBody = emailBody.length > 2000 ? emailBody.substring(0, 2000) + '...' : emailBody;
    const prompt = `Summarize this email in 2-3 sentences:\n\n${truncatedBody}`;
    return this.generate(prompt);
  }

  async generateReply(originalEmail: string, tone: Tone): Promise<string[]> {
    const toneInstructions: Record<Tone, string> = {
      formal: 'Write a formal, professional reply',
      friendly: 'Write a friendly, warm reply',
      assertive: 'Write a direct, assertive reply',
      short: 'Write a brief, concise reply (2-3 sentences)',
    };

    // Truncate email body if too long for faster processing
    const truncatedBody = originalEmail.length > 2000 ? originalEmail.substring(0, 2000) + '...' : originalEmail;
    const prompt = `${toneInstructions[tone]}. Email:\n\n${truncatedBody}\n\nReply:`;

    // Generate only one reply for speed (user can regenerate if needed)
    const reply = await this.generate(prompt);
    return [reply];
  }

  async rewriteText(text: string, instruction: string): Promise<string> {
    const prompt = `Rewrite the following text: ${instruction}\n\nText:\n${text}`;
    return this.generate(prompt);
  }

  async generateFollowUp(originalEmail: string): Promise<string> {
    // Truncate email body if too long for faster processing
    const truncatedBody = originalEmail.length > 2000 ? originalEmail.substring(0, 2000) + '...' : originalEmail;
    const prompt = `Generate a polite follow-up email:\n\n${truncatedBody}`;
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

