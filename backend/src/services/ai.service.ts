import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type Tone = 'formal' | 'friendly' | 'assertive' | 'short' | 'negative' | 'concise';

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private openaiInitialized: boolean = false;
  private cachedModels: string[] | null = null;
  private geminiInitialized: boolean = false;
  private initializationError: string | null = null;

  constructor() {
    // ── OpenAI (primary) ──────────────────────────────────────────────────────
    if (config.ai.openAiKey && config.ai.openAiKey.trim().length > 0) {
      try {
        this.openai = new OpenAI({ apiKey: config.ai.openAiKey });
        this.openaiInitialized = true;
        logger.info('OpenAI service initialized (primary AI provider)');
      } catch (err: any) {
        logger.warn('OpenAI initialization failed:', err.message);
      }
    } else {
      logger.info('No OPENAI_API_KEY set — will use Gemini only');
    }

    // ── Gemini (fallback) ──────────────────────────────────────────────────────
    try {
      if (!config.ai.geminiKey || config.ai.geminiKey.trim().length === 0) {
        if (!this.openaiInitialized) {
          this.initializationError = 'No AI API key configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in backend/.env';
          logger.warn(this.initializationError);
        }
        return;
      }
      this.gemini = new GoogleGenerativeAI(config.ai.geminiKey);
      this.geminiInitialized = true;
      logger.info('Gemini AI service initialized (fallback provider)');

      this.verifyAPIKey().then(result => {
        if (result.valid) {
          this.cachedModels = result.availableModels;
          logger.info(`Gemini models cached: ${result.availableModels.join(', ')}`);
        }
      }).catch(err => {
        logger.warn('Could not verify Gemini API key on startup:', err.message);
      });
    } catch (error: any) {
      this.initializationError = error.message || 'Failed to initialize Gemini AI service';
      logger.error('Gemini AI service initialization error:', error);
    }
  }

  // ── OpenAI text generation ───────────────────────────────────────────────────
  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai || !this.openaiInitialized) throw new Error('OpenAI not initialized');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });
    const text = response.choices[0]?.message?.content || '';
    if (!text.trim()) throw new Error('Empty response from OpenAI');
    logger.info('Generated via OpenAI gpt-4o-mini');
    return text.trim();
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
    // ── Try OpenAI first ──────────────────────────────────────────────────────
    if (this.openaiInitialized) {
      try {
        return await this.generateWithOpenAI(prompt);
      } catch (err: any) {
        logger.warn('OpenAI failed, falling back to Gemini:', err.message);
      }
    }

    // ── Gemini fallback ───────────────────────────────────────────────────────
    if (!this.geminiInitialized && !this.openaiInitialized) {
      throw new Error(this.initializationError || 'No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.');
    }
    if (!this.geminiInitialized) {
      throw new Error('OpenAI failed and Gemini is not configured.');
    }
    if (!this.gemini) {
      throw new Error('Gemini AI service not initialized');
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
      concise: 'Write a brief, concise reply (2-3 sentences)',
      negative: 'Write a polite but firm reply expressing disagreement or concerns',
    };

    // Truncate email body if too long for faster processing
    const truncatedBody = originalEmail.length > 2000 ? originalEmail.substring(0, 2000) + '...' : originalEmail;
    
    // Build prompt with signature instruction if provided
    let prompt = `Write exactly ONE ${toneInstructions[tone].toLowerCase()} ready to send. DO NOT provide multiple options. DO NOT include a "Subject:" line, "Re:", or any explanatory text before or after the email body.\n\nOriginal Email:\n${truncatedBody}\n\n`;
    
    if (signature && signature.trim()) {
      prompt += `IMPORTANT: You must sign off with the exact following signature at the end: \n${signature.trim()}\n\n`;
    }

    prompt += `Drafted Reply:\n`;

    // Generate only one reply for speed (user can regenerate if needed)
    const reply = await this.generate(prompt);
    
    // Clean up the reply (remove markdown, options, etc)
    let finalReply = this.cleanEnhancedText(reply);
    
    // Ensure signature is appended if not already included
    if (signature && signature.trim() && !finalReply.includes(signature.trim())) {
      finalReply = `${finalReply}\n\n${signature.trim()}`;
    }
    
    return [finalReply];
  }

  async rewriteText(text: string, instruction: string, userName?: string, userSignature?: string): Promise<string> {
    const contextStr = [
      userName ? `Sender Name: ${userName}` : '',
      userSignature ? `Sender Signature:\n${userSignature}` : ''
    ].filter(Boolean).join('\n');

    const rules = `
IMPORTANT RULES:
1. DO NOT include a "Subject:" line under any circumstances. This is strictly the email body.
2. DO NOT use generic bracketed placeholders like [Name] or [Your Name].
3. ${userName ? `Whenever the sender's name is needed, use "${userName}".` : 'Do not sign off with a specific name if none is provided in the text.'}
4. ${userSignature ? `Append the sender's signature exactly as provided at the very bottom.` : ''}
    `.trim();

    // For enhance operations, be more direct - just return the enhanced text without explanations
    if (instruction.toLowerCase().includes('enhance') || instruction.toLowerCase().includes('improve')) {
      const prompt = `Rewrite and enhance the following email text. ${instruction}\n\n${contextStr}\n\n${rules}\n\nReturn ONLY the enhanced email text, nothing else. No explanations, no options, no markdown formatting. Just the improved email text ready to send:\n\n${text}`;
      const result = await this.generate(prompt);
      // Clean up the result - remove any explanations or markdown
      return this.cleanEnhancedText(result);
    }
    
    const prompt = `Rewrite the following text: ${instruction}\n\n${contextStr}\n\n${rules}\n\nText:\n${text}\n\nReturn only the rewritten text, no explanations.`;
    const result = await this.generate(prompt);
    return this.cleanEnhancedText(result);
  }

  private cleanEnhancedText(text: string): string {
    // Remove common AI explanation patterns
    let cleaned = text.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    
    // Remove "Here are" or "Here is" patterns
    cleaned = cleaned.replace(/^Here (are|is)[\s\S]*?(?=\n\n|$)/m, '');
    
    // Remove "Option 1", "Option 2" patterns
    cleaned = cleaned.replace(/\*\*Option \d+[^*]*\*\*[\s\S]*?(?=\n\n|\*\*Option|\*Key|$)/g, '');
    
    // Remove "Key improvements" sections
    cleaned = cleaned.replace(/\*\*Key improvements[\s\S]*$/m, '');
    
    // Remove "To choose" sections
    cleaned = cleaned.replace(/\*\*To choose[\s\S]*$/m, '');
    
    // Remove quoted text markers
    cleaned = cleaned.replace(/^>\s*/gm, '');
    
    // Remove extra blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading/trailing whitespace from each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    
    return cleaned.trim();
  }

  async generateFollowUp(originalEmail: string, stepNumber: number = 1, delayDays: number = 2, tone: string = 'friendly', userName: string = '', recipientName: string = ''): Promise<string> {
    // Truncate email body if too long for faster processing
    const truncatedBody = originalEmail.length > 2000 ? originalEmail.substring(0, 2000) + '...' : originalEmail;
    
    let toneInstruction = 'polite and friendly';
    if (tone === 'formal') toneInstruction = 'formal and professional';
    if (tone === 'assertive') toneInstruction = 'direct and assertive';
    if (tone === 'short') toneInstruction = 'very brief and concise';
    
    let stepContext = '';
    if (stepNumber === 1) {
      stepContext = `It has been ${delayDays} days since the last email. This is the first follow-up. Just casually checking in.`;
    } else if (stepNumber === 2) {
      stepContext = `It has been another ${delayDays} days. This is the second follow-up. Try to bubble this up to the top of their inbox gently without being annoying.`;
    } else {
      stepContext = `This is follow-up #${stepNumber}. It has been ${delayDays} days since the last one. Be polite but try to get a clear yes/no/status.`;
    }

    // Attempt to extract sensible names if none are provided
    const sender = userName || 'the sender';
    const recipient = recipientName || 'them';

    const prompt = `Generate a ${toneInstruction} follow-up email draft sent from ${sender} to ${recipient}.\nContext: ${stepContext}\n\nOriginal email context:\n${truncatedBody}\n\nIMPORTANT RULES:\n1. This is being sent as a REPLY in an existing thread. DO NOT include a "Subject:" line. DO NOT include "Re: ...". Just write the plain email body.\n2. Do NOT use fake bracketed placeholders like [Name] or [Your Name]. If you don't know the exact name, use a generic greeting like "Hi there," and just sign off without a name or use "${sender}" if provided.\n3. Return ONLY the email draft ready to send, strictly no explanations.`;
    return this.generate(prompt);
  }

  async generateCampaignEmail(context: string): Promise<string> {
    const prompt = `You are writing a cold email on behalf of a job seeker or professional.

STRICT RULES — violating any of these is unacceptable:
1. Write like a real human, NOT like an AI or a template.
2. NEVER use placeholder brackets like [Name], [Company], [Role] — only use real info from the context.
3. NEVER use these opening lines: "I hope this email finds you well", "My name is", "I am writing to"
4. NEVER use these closing lines: "Thank you for your time and consideration", "Looking forward to hearing from you", "I would welcome the opportunity"
5. NEVER use corporate jargon: "leverage", "synergies", "touch base", "circle back", "reach out", "paradigm"
6. NEVER mention attaching resume unless the context specifically says to ("I have attached my resume" is BANNED unless user requested it).
7. Keep it short — 3 short paragraphs max. No fluff, no padding.
8. Use exactly the greeting and signature specified in the context.
9. Sound confident, direct, and human. End naturally without a formal closing line.
10. No Subject line in the body.

Context:
${context}

Write the email body now:`;
    return this.generate(prompt);
  }

  async extractEmailsFromFileVision(buffer: Buffer, mimeType: string): Promise<string[]> {
    const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const visionPrompt = 'Look carefully at this image or document. Find every email address visible in it. Read character by character — do NOT guess or hallucinate. Return ONLY a plain comma-separated list of the exact email addresses you can see. No explanations, no labels, no markdown. If you see no emails, return an empty string.';

    // ── Strategy A: OpenAI Vision (GPT-4o) — best at image OCR ──────────────
    if (this.openai && this.openaiInitialized) {
      try {
        const supportedByOpenAI = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (supportedByOpenAI.includes(mimeType) || mimeType.startsWith('image/')) {
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64}`;

          const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
                { type: 'text', text: visionPrompt },
              ],
            }],
            max_tokens: 1000,
            temperature: 0,
          });

          const text = (response.choices[0]?.message?.content || '').trim();
          logger.info(`OpenAI Vision response: ${text.slice(0, 200)}`);
          const found = text.match(EMAIL_REGEX) || [];
          const emails = [...new Set(found.map(e => e.toLowerCase()))];
          if (emails.length > 0) {
            logger.info(`OpenAI Vision extracted ${emails.length} emails`);
            return emails;
          }
          logger.warn('OpenAI Vision returned 0 emails, trying Gemini Vision...');
        }
      } catch (err: any) {
        logger.warn('OpenAI Vision failed, trying Gemini Vision:', err.message);
      }
    }

    // ── Strategy B: Gemini Vision fallback ───────────────────────────────────
    if (!this.gemini || !this.geminiInitialized) return [];

    try {
      const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'application/pdf'];
      const visionMime = supportedMimes.includes(mimeType) ? mimeType : 'application/pdf';
      const modelName = this.cachedModels?.find(m => m.includes('flash') && !m.includes('lite') && !m.includes('image'))
        || 'gemini-2.0-flash';
      const model = this.gemini.getGenerativeModel({ model: modelName });
      const base64Data = buffer.toString('base64');

      const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType: visionMime } },
        visionPrompt,
      ]);

      const text = result.response.text().trim();
      logger.info(`Gemini Vision response: ${text.slice(0, 200)}`);
      const found = text.match(EMAIL_REGEX) || [];
      return [...new Set(found.map(e => e.toLowerCase()))];
    } catch (err: any) {
      logger.error('Gemini Vision email extraction failed:', err.message);
      return [];
    }
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

