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
      
      // Verify API key and cache available models asynchronously (don't block initialization)
      this.verifyAPIKey().then(result => {
        if (result.valid) {
          logger.info(`Gemini API key verified. Available models: ${result.availableModels.join(', ') || 'default free tier models'}`);
          // Cache the models for use in generate()
          this.cachedModels = result.availableModels;
        } else {
          logger.warn(`Gemini API key verification failed: ${result.error}`);
          logger.warn('Please verify your API key at https://makersuite.google.com/app/apikey');
          logger.warn('Also ensure:');
          logger.warn('1. The Generative Language API is enabled in Google Cloud Console');
          logger.warn('2. Your API key has access to Gemini models');
          logger.warn('3. Billing may need to be enabled for some models (free tier should still work)');
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
      // Try v1 first (newer API), fallback to v1beta if needed
      const apiKey = config.ai.geminiKey;
      let url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      let response = await fetch(url);
      
      // If v1 fails, try v1beta
      if (!response.ok && response.status === 404) {
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        response = await fetch(url);
      }
      
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

    // Cache the models list to avoid repeated API calls (but refresh occasionally)
    if (this.cachedModels !== null && this.cachedModels.length > 0) {
      return this.cachedModels;
    }

    try {
      const verification = await this.verifyAPIKey();
      if (verification.valid && verification.availableModels.length > 0) {
        logger.info('Found available models:', verification.availableModels);
        return verification.availableModels;
      } else {
        logger.warn('API key verification failed or no models found:', verification.error);
      }
    } catch (error: any) {
      logger.warn('Could not list available models, will use defaults:', error.message);
    }
    
    // Return empty array, will use fallback models
    if (this.cachedModels === null) {
      this.cachedModels = [];
    }
    return [];
  }

  private async generate(prompt: string): Promise<string> {
    if (!this.geminiInitialized || this.initializationError) {
      throw new Error(this.initializationError || 'Gemini AI service not initialized. Please check your GEMINI_API_KEY in backend/.env file');
    }

    if (!this.gemini) {
      throw new Error(this.initializationError || 'Gemini AI service not initialized');
    }

    // Try to get available models first
    let availableModels = await this.listAvailableModels();
    
    // Default model names to try - include variants
    let modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
    ];

    // If we have available models from API, use those first
    if (availableModels && availableModels.length > 0) {
      logger.info('Using available models from API:', availableModels);
      // Filter to models that support generateContent
      const generateModels = availableModels.filter(m => 
        m.includes('gemini') && (m.includes('flash') || m.includes('pro'))
      );
      if (generateModels.length > 0) {
        modelsToTry = [...generateModels, ...modelsToTry.filter(m => !generateModels.includes(m))];
      }
    } else {
      logger.warn('Could not fetch available models, using default list');
    }

    let lastError: any = null;
    const errors: string[] = [];

    for (const modelName of modelsToTry) {
      // Try SDK first - it might work even if direct API doesn't
      // The SDK handles API version negotiation automatically
      try {
        logger.info(`Trying Gemini model: ${modelName} via SDK`);
        
        const model = this.gemini.getGenerativeModel({ 
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from model');
        }
        
        logger.info(`Successfully used model: ${modelName} via SDK`);
        return text.trim();
      } catch (sdkError: any) {
        const sdkErrorMsg = sdkError?.message || String(sdkError);
        const sdkErrorString = JSON.stringify(sdkError) || sdkErrorMsg;
        logger.warn(`SDK failed for ${modelName}:`, sdkErrorMsg);
        
        // Check if it's a v1beta/404 error
        const isV1BetaError = sdkErrorString.includes('v1beta') || sdkErrorMsg.includes('v1beta') || sdkErrorString.includes('/v1beta/');
        const is404Error = sdkErrorMsg.includes('404') || sdkErrorString.includes('404');
        
        // If SDK fails with v1beta/404, try direct v1 API as fallback
        if (isV1BetaError || is404Error) {
          logger.info(`SDK failed with v1beta/404 error, trying direct v1 API for ${modelName}`);
          
          try {
            const apiKey = config.ai.geminiKey;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: prompt
                    }]
                  }]
                })
              }
            );
            
            if (response.ok) {
              const data = await response.json() as any;
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text && text.trim()) {
                logger.info(`Successfully used model ${modelName} via direct v1 API fallback`);
                return text.trim();
              }
            } else {
              const errorText = await response.text().catch(() => 'Could not read error response');
              logger.warn(`Direct v1 API also failed for ${modelName}: ${response.status} ${errorText}`);
              
              // Parse error response to get more details
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error?.message) {
                  logger.warn(`API Error details: ${errorData.error.message}`);
                  errors.push(`${modelName}: ${errorData.error.message}`);
                } else {
                  errors.push(`${modelName}: Direct v1 API returned ${response.status}`);
                }
              } catch (e) {
                errors.push(`${modelName}: Direct v1 API returned ${response.status} - ${errorText.substring(0, 100)}`);
              }
              
              // Continue to next model
              lastError = sdkError;
              continue;
            }
          } catch (directApiError: any) {
            logger.warn(`Direct v1 API fallback call failed for ${modelName}:`, directApiError.message);
            errors.push(`${modelName}: SDK failed (${sdkErrorMsg.substring(0, 50)}...) and direct API also failed`);
            lastError = sdkError;
            continue;
          }
        } else {
          // SDK failed with non-404 error, record and continue
          lastError = sdkError;
          const errorDetails = sdkError?.errorDetails || sdkError?.status || '';
          errors.push(`${modelName}: ${sdkErrorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
          
          // If it's authentication/authorization, don't try other models
          if (sdkErrorMsg.includes('401') || 
              sdkErrorMsg.includes('403') || 
              sdkErrorMsg.includes('Authentication') || 
              sdkErrorMsg.includes('API key') ||
              sdkErrorMsg.includes('PERMISSION_DENIED') ||
              (sdkErrorMsg.includes('INVALID_ARGUMENT') && sdkErrorMsg.includes('API key'))) {
            logger.error('Authentication error detected, stopping model attempts');
            break;
          }
          
          // For quota/rate limit errors, try next model (might be model-specific)
          if (sdkErrorMsg.includes('quota') || sdkErrorMsg.includes('429') || sdkErrorMsg.includes('rate limit')) {
            logger.warn(`Rate limit on ${modelName}, trying next model`);
            continue;
          }
          
          // For other errors, try next model
          continue;
        }
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
    // This often happens when SDK uses v1beta but models need v1, or API key doesn't have access
    const allErrorsString = errors.join(' ');
    const has404Error = errorMsg.includes('404') || errors.some(e => e.includes('404')) || allErrorsString.includes('404');
    const hasV1BetaError = errorMsg.includes('v1beta') || errors.some(e => e.includes('v1beta')) || allErrorsString.includes('v1beta') || allErrorsString.includes('/v1beta/');
    const hasNotFoundError = errorMsg.includes('not found') || errors.some(e => e.includes('not found')) || allErrorsString.includes('NotFound');
    
    if (has404Error || hasNotFoundError || hasV1BetaError) {
      const helpText = hasV1BetaError 
        ? 'The SDK tried to use v1beta API but models require v1. We attempted to use v1 API directly, but it appears your API key may not have access or there\'s a configuration issue.'
        : 'Models are not available. This could be due to API key permissions or model availability.';
      
      throw new Error(`AI generation failed: No free tier models available. ${helpText}\n\nPlease verify:\n1. Your Gemini API key is valid and active (get one at https://makersuite.google.com/app/apikey)\n2. The Generative Language API is enabled in Google Cloud Console\n3. Your API key has access to free tier models (gemini-1.5-flash, gemini-1.5-pro)\n4. Try regenerating your API key if the issue persists\n5. Check that your API key hasn't reached rate limits\n\nErrors: ${errors.join('; ')}`);
    }
    
    throw new Error(`AI generation failed: ${errorMsg}\n\nTried models: ${modelsToTry.join(', ')}\nErrors: ${errors.join('; ')}\n\nPlease verify your GEMINI_API_KEY in backend/.env is correct and get a free API key at https://makersuite.google.com/app/apikey`);
  }

  async summarizeEmail(emailBody: string): Promise<string> {
    // Truncate email body if too long for faster processing
    const truncatedBody = emailBody.length > 2000 ? emailBody.substring(0, 2000) + '...' : emailBody;
    const prompt = `Summarize this email in 2-3 sentences:\n\n${truncatedBody}`;
    return this.generate(prompt);
  }

  async generateReply(originalEmail: string, tone: Tone, signature?: string): Promise<string[]> {
    const toneInstructions: Record<Tone, string> = {
      formal: 'Write a formal, professional reply',
      friendly: 'Write a friendly, warm reply',
      assertive: 'Write a direct, assertive reply',
      short: 'Write a brief, concise reply (2-3 sentences)',
    };

    // Truncate email body if too long for faster processing
    const truncatedBody = originalEmail.length > 2000 ? originalEmail.substring(0, 2000) + '...' : originalEmail;
    
    // Build prompt with signature instruction if provided
    let prompt = `${toneInstructions[tone]}. Email:\n\n${truncatedBody}\n\nReply:`;
    
    if (signature && signature.trim()) {
      prompt += `\n\nNote: Include the following signature at the end: ${signature.trim()}`;
    }

    // Generate only one reply for speed (user can regenerate if needed)
    const reply = await this.generate(prompt);
    
    // Ensure signature is appended if not already included
    let finalReply = reply;
    if (signature && signature.trim() && !reply.includes(signature.trim())) {
      finalReply = `${reply}\n\n${signature.trim()}`;
    }
    
    return [finalReply];
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

