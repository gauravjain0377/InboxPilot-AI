import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type Tone = 'formal' | 'friendly' | 'assertive' | 'short' | 'negative' | 'concise';

const DEFAULT_SENDER_PROFILE = `
Name: Gaurav Jain
Status: Final year B.Tech Information Technology student at Poornima College of Engineering, Jaipur | CGPA 9.0
Primary Stack: JavaScript, TypeScript, React, Next.js, Node.js, Express.js, MongoDB, REST APIs
GitHub: github.com/gauravjain0377

PROJECTS (pick 1-2 most relevant to the company):

1. InboxPilot AI — AI-powered Gmail assistant (Next.js, Node.js, Gemini AI, Gmail API, OAuth2)
   - Built a system that reads, categorizes, and drafts replies to emails using AI
   - Implemented background campaign system sending personalized cold emails to 100+ companies
   - Designed real-time follow-up scheduling, Google Calendar integration, and analytics dashboard
   - Sole architect and developer — handled frontend, backend, AI integration, and deployment

2. StockSathi — Real-time stock trading simulation platform (React, Node.js, MongoDB, Socket.io, WebSockets)
   - Built live market data streaming using WebSockets, batched Yahoo Finance API calls to avoid rate limits
   - Designed portfolio management with buy/sell logic, transaction history, and P&L tracking
   - Integrated JWT auth + Google OAuth, transactional emails via Brevo
   - Solved complex state-sync problems between WebSocket server and React frontend

3. HackZen — Full-stack hackathon management platform (React, Node.js, MongoDB, Socket.io, Cloudinary)
   - Team project: designed and built backend APIs for participant registration, team formation, judging workflow, and result declaration
   - Implemented role-based access control (RBAC) for 4 user types: participants, organizers, judges, admins
   - Integrated 2FA (TOTP via speakeasy), Google/GitHub OAuth (Passport.js), file uploads to Cloudinary

INTERNSHIPS:

1. STPI (Software Technology Parks of India) — under Ministry of Electronics & IT, Govt. of India
   - Full Stack Developer Intern
   - Built a Hackathon Management System: end-to-end, from participant registration to result declaration
   - Designed REST APIs, role-based workflows, MongoDB schemas, authentication, and API integration
   - Worked in Agile sprints with requirement analysis, testing, and sprint reviews

2. Edunet Foundation (in collaboration with AICTE)
   - Frontend Developer Intern
   - Built responsive React UIs with reusable components, integrated APIs, handled state management
   - Applied performance optimization: lazy loading, code splitting, asset optimization

ACHIEVEMENTS:
- Winner, EDU Chain Hackathon (Earn Category) — built Cryptify, a blockchain-based contract & payment platform — awarded $4,000 prize
- Selected for Open Campus Incubator Program for Cryptify
- Winner, Microsoft Asia AI Odyssey 2024
- FOSS Hack Campus Ambassador — Delhi NCR
- 2nd place, TEK-Connect project exhibition

WHAT HE'S LOOKING FOR:
SDE Intern / Full-Time SDE role in a product-focused company. Strong preference for companies building developer tools, fintech, AI, or platform infrastructure. Wants to contribute to real backend systems, not just fix CSS.
`.trim();

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
      const apiKey = config.ai.geminiKey;
      let url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      let response = await fetch(url);

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
          error: `API key verification failed: ${response.status} ${errorText}`,
        };
      }
    } catch (error: any) {
      logger.error('API key verification error:', error);
      return {
        valid: false,
        availableModels: [],
        error: error.message || 'Failed to verify API key',
      };
    }
  }

  private async listAvailableModels(): Promise<string[]> {
    if (!this.gemini) return [];

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

    let availableModels = await this.listAvailableModels();

    let modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
    ];

    if (availableModels && availableModels.length > 0) {
      logger.info('Using available models from API:', availableModels);
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
      try {
        logger.info(`Trying Gemini model: ${modelName} via SDK`);

        const model = this.gemini.getGenerativeModel({ model: modelName });
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

        const isV1BetaError = sdkErrorString.includes('v1beta') || sdkErrorMsg.includes('v1beta') || sdkErrorString.includes('/v1beta/');
        const is404Error = sdkErrorMsg.includes('404') || sdkErrorString.includes('404');

        if (isV1BetaError || is404Error) {
          logger.info(`SDK failed with v1beta/404 error, trying direct v1 API for ${modelName}`);

          try {
            const apiKey = config.ai.geminiKey;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                }),
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
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error?.message) {
                  logger.warn(`API Error details: ${errorData.error.message}`);
                  errors.push(`${modelName}: ${errorData.error.message}`);
                } else {
                  errors.push(`${modelName}: Direct v1 API returned ${response.status}`);
                }
              } catch {
                errors.push(`${modelName}: Direct v1 API returned ${response.status} - ${errorText.substring(0, 100)}`);
              }
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
          lastError = sdkError;
          const errorDetails = sdkError?.errorDetails || sdkError?.status || '';
          errors.push(`${modelName}: ${sdkErrorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);

          if (
            sdkErrorMsg.includes('401') ||
            sdkErrorMsg.includes('403') ||
            sdkErrorMsg.includes('Authentication') ||
            sdkErrorMsg.includes('API key') ||
            sdkErrorMsg.includes('PERMISSION_DENIED') ||
            (sdkErrorMsg.includes('INVALID_ARGUMENT') && sdkErrorMsg.includes('API key'))
          ) {
            logger.error('Authentication error detected, stopping model attempts');
            break;
          }

          if (sdkErrorMsg.includes('quota') || sdkErrorMsg.includes('429') || sdkErrorMsg.includes('rate limit')) {
            logger.warn(`Rate limit on ${modelName}, trying next model`);
            continue;
          }

          continue;
        }
      }
    }

    const errorMsg = lastError?.message || String(lastError) || 'Unknown error';
    logger.error('All Gemini models failed. Errors:', errors);

    if (errorMsg.includes('API key') || errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('Authentication') || errorMsg.includes('Invalid') || errorMsg.includes('PERMISSION_DENIED')) {
      throw new Error(`AI generation failed: Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in backend/.env file. Get a free API key at https://makersuite.google.com/app/apikey`);
    }

    if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      throw new Error(`AI generation failed: Free tier quota exceeded or rate limited. Please check your Gemini API usage limits at https://makersuite.google.com/app/apikey`);
    }

    const allErrorsString = errors.join(' ');
    const has404Error = errorMsg.includes('404') || errors.some(e => e.includes('404')) || allErrorsString.includes('404');
    const hasV1BetaError = errorMsg.includes('v1beta') || errors.some(e => e.includes('v1beta')) || allErrorsString.includes('v1beta') || allErrorsString.includes('/v1beta/');
    const hasNotFoundError = errorMsg.includes('not found') || errors.some(e => e.includes('not found')) || allErrorsString.includes('NotFound');

    if (has404Error || hasNotFoundError || hasV1BetaError) {
      const helpText = hasV1BetaError
        ? "The SDK tried to use v1beta API but models require v1. We attempted to use v1 API directly, but it appears your API key may not have access or there's a configuration issue."
        : 'Models are not available. This could be due to API key permissions or model availability.';
      throw new Error(`AI generation failed: No free tier models available. ${helpText}\n\nPlease verify:\n1. Your Gemini API key is valid and active (get one at https://makersuite.google.com/app/apikey)\n2. The Generative Language API is enabled in Google Cloud Console\n3. Your API key has access to free tier models (gemini-1.5-flash, gemini-1.5-pro)\n4. Try regenerating your API key if the issue persists\n5. Check that your API key hasn't reached rate limits\n\nErrors: ${errors.join('; ')}`);
    }

    throw new Error(`AI generation failed: ${errorMsg}\n\nTried models: ${modelsToTry.join(', ')}\nErrors: ${errors.join('; ')}\n\nPlease verify your GEMINI_API_KEY in backend/.env is correct and get a free API key at https://makersuite.google.com/app/apikey`);
  }

  // ─── Standard email methods (untouched) ───────────────────────────────────────

  async summarizeEmail(emailBody: string): Promise<string> {
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

    const truncatedBody = originalEmail.length > 2000 ? originalEmail.substring(0, 2000) + '...' : originalEmail;

    let prompt = `Write exactly ONE ${toneInstructions[tone].toLowerCase()} ready to send. DO NOT provide multiple options. DO NOT include a "Subject:" line, "Re:", or any explanatory text before or after the email body.\n\nOriginal Email:\n${truncatedBody}\n\n`;

    if (signature && signature.trim()) {
      prompt += `IMPORTANT: You must sign off with the exact following signature at the end: \n${signature.trim()}\n\n`;
    }

    prompt += `Drafted Reply:\n`;

    const reply = await this.generate(prompt);

    let finalReply = this.cleanEnhancedText(reply);

    if (signature && signature.trim() && !finalReply.includes(signature.trim())) {
      finalReply = `${finalReply}\n\n${signature.trim()}`;
    }

    return [finalReply];
  }

  async rewriteText(text: string, instruction: string, userName?: string, userSignature?: string): Promise<string> {
    const contextStr = [
      userName ? `Sender Name: ${userName}` : '',
      userSignature ? `Sender Signature:\n${userSignature}` : '',
    ].filter(Boolean).join('\n');

    const rules = `
IMPORTANT RULES:
1. DO NOT include a "Subject:" line under any circumstances. This is strictly the email body.
2. DO NOT use generic bracketed placeholders like [Name] or [Your Name].
3. ${userName ? `Whenever the sender's name is needed, use "${userName}".` : 'Do not sign off with a specific name if none is provided in the text.'}
4. ${userSignature ? `Append the sender's signature exactly as provided at the very bottom.` : ''}
    `.trim();

    if (instruction.toLowerCase().includes('enhance') || instruction.toLowerCase().includes('improve')) {
      const prompt = `Rewrite and enhance the following email text. ${instruction}\n\n${contextStr}\n\n${rules}\n\nReturn ONLY the enhanced email text, nothing else. No explanations, no options, no markdown formatting. Just the improved email text ready to send:\n\n${text}`;
      const result = await this.generate(prompt);
      return this.cleanEnhancedText(result);
    }

    const prompt = `Rewrite the following text: ${instruction}\n\n${contextStr}\n\n${rules}\n\nText:\n${text}\n\nReturn only the rewritten text, no explanations.`;
    const result = await this.generate(prompt);
    return this.cleanEnhancedText(result);
  }

  private cleanEnhancedText(text: string): string {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/^Here (are|is)[\s\S]*?(?=\n\n|$)/m, '');
    cleaned = cleaned.replace(/\*\*Option \d+[^*]*\*\*[\s\S]*?(?=\n\n|\*\*Option|\*Key|$)/g, '');
    cleaned = cleaned.replace(/\*\*Key improvements[\s\S]*$/m, '');
    cleaned = cleaned.replace(/\*\*To choose[\s\S]*$/m, '');
    cleaned = cleaned.replace(/^>\s*/gm, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    return cleaned.trim();
  }

  // ─── Follow-up generation (inbox feature — NOT campaign) ──────────────────────
  async generateFollowUp(
    originalEmail: string,
    stepNumber: number = 1,
    delayDays: number = 2,
    tone: string = 'friendly',
    userName: string = '',
    recipientName: string = '',
  ): Promise<string> {
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

    const sender = userName || 'the sender';
    const recipient = recipientName || 'them';

    const prompt = `Generate a ${toneInstruction} follow-up email draft sent from ${sender} to ${recipient}.\nContext: ${stepContext}\n\nOriginal email context:\n${truncatedBody}\n\nIMPORTANT RULES:\n1. This is being sent as a REPLY in an existing thread. DO NOT include a "Subject:" line. DO NOT include "Re: ...". Just write the plain email body.\n2. Do NOT use fake bracketed placeholders like [Name] or [Your Name]. If you don't know the exact name, use a generic greeting like "Hi there," and just sign off without a name or use "${sender}" if provided.\n3. Return ONLY the email draft ready to send, strictly no explanations.`;
    return this.generate(prompt);
  }

  // ─── Vision: extract emails from image/PDF ────────────────────────────────────
  async extractEmailsFromFileVision(buffer: Buffer, mimeType: string): Promise<string[]> {
    const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const visionPrompt = 'Look carefully at this image or document. Find every email address visible in it. Read character by character — do NOT guess or hallucinate. Return ONLY a plain comma-separated list of the exact email addresses you can see. No explanations, no labels, no markdown. If you see no emails, return an empty string.';

    // ── Strategy A: OpenAI Vision (GPT-4o) ──────────────────────────────────
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

  // ─── Company Research ─────────────────────────────────────────────────────────
  async fetchCompanyInfo(companyName: string, domain: string): Promise<string> {
    // Strategy A: Fetch company website and summarize
    try {
      const url = `https://${domain}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InboxPilot/1.0; +https://inboxpilot.app)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeoutId);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const html = await resp.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);

      if (text.length < 80) throw new Error('Too little content from website');

      const summary = await this.generate(
        `Based on this website content from ${companyName} (${domain}), write 2–3 specific sentences describing:\n1. What the company does (their core business/product/service)\n2. Their industry or domain\n3. Any notable mission, clients, or product names\n\nBe factual and specific. No fluff:\n\n${text}`
      );
      logger.info(`Company info fetched via website for ${companyName}`);
      return summary;
    } catch (err: any) {
      logger.warn(`Website fetch failed for ${domain}: ${err.message}. Trying AI knowledge...`);
    }

    // Strategy B: Use AI general knowledge about the company
    try {
      const summary = await this.generate(
        `In 2–3 specific sentences, describe what ${companyName} does. Include their core business/product/service, industry, and any notable product names or clients you know. If you don't know, say what a company named "${companyName}" in the domain "${domain}" likely does based on their name/domain. Be concrete and factual.`
      );
      logger.info(`Company info via AI knowledge for ${companyName}`);
      return summary;
    } catch {
      return `${companyName} is a company in the technology sector.`;
    }
  }

  // ─── Campaign: Generate AI email (per-email, grounded in real profile) ────────
  async generateCampaignEmail(context: string): Promise<string> {
    // Merge default profile if context is sparse
    const fullContext = context.trim().length < 200
      ? `${DEFAULT_SENDER_PROFILE}\n\nAdditional context:\n${context}`
      : context;

    const prompt = `You are ghostwriting a cold outreach email for Gaurav Jain, a B.Tech IT student and full-stack developer.

You write like a real human being — not a recruiter, not a template, not an AI.
Imagine a senior software engineer who has been in the industry 20 years sits down and writes a short, honest note.
They know what they've built. They don't oversell. They don't beg. They state what they've done, connect it to the company, and make a clean ask.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFINITIONS OF FAILURE (NEVER do these):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Opening with: "I hope this email finds you well", "My name is", "I am writing to", "I wanted to reach out"
❌ Asking: "Would you love to have a quick chat?" — BANNED FOREVER
❌ Closing with: "Thank you for your time and consideration", "Looking forward to hearing from you", "I would welcome the opportunity", "It would be a pleasure"
❌ Corporate jargon: "leverage", "synergy", "circle back", "touch base", "paradigm shift", "value add"
❌ Saying "I have attached my resume" unless explicitly in context
❌ Placeholder brackets: [Name], [Company], [Role] — NEVER
❌ Sounding desperate or over-eager
❌ More than 3 short paragraphs
❌ Starting every sentence with "I"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFINITIONS OF SUCCESS (ALWAYS do these):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sound like a real person who has built real things
✅ First sentence must hook — a direct, confident statement about why you're reaching out
✅ Second paragraph: reference 1-2 real projects from context that are directly relevant to this type of company
✅ Third paragraph: ONE clean, direct ask — specific to the role. Examples of good CTAs:
   - "If there's an opening, I'd like to be considered."
   - "Happy to share my work if there's a fit."
   - "Let me know if it makes sense to connect."
✅ Use the exact greeting and signature from context
✅ Keep under 130 words. Short emails get read. Long emails get deleted.
✅ No Subject line in the body
✅ Sound like a confident engineer, not a student begging for a chance

Context:
${fullContext}

Write ONLY the email body now. Nothing else.`;

    return this.generate(prompt);
  }

  // ─── Campaign: Generate personalized company email (per-company research) ──────
  async generatePersonalizedCompanyEmail(params: {
    companyName: string;
    companyInfo: string;
    recipientEmail: string;
    context: string;
    greeting: string;
    senderName: string;
    senderTitle: string;
    role: string;
    tone: string;
    senderSignature: string;
    extraNotes: string;
  }): Promise<{ subject: string; body: string }> {
    const {
      companyName, companyInfo, context, greeting,
      senderName, senderTitle, role, tone, senderSignature, extraNotes,
    } = params;

    // Fall back to Gaurav's full profile if context is sparse
    const fullContext = (!context || context.trim().length < 150)
      ? DEFAULT_SENDER_PROFILE
      : context;

    const prompt = `You are ghostwriting a cold job outreach email. Write as if a real person — a confident, experienced software engineer — sat down and typed this themselves.

The email is FROM: ${senderName || 'Gaurav Jain'} (${senderTitle || 'B.Tech IT Final Year, Full-Stack Developer'})
The email is TO: hiring team at ${companyName}
Role being explored: ${role || 'SDE Internship / Full-Time'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT ${companyName.toUpperCase()} (use this to personalize paragraph 1):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${companyInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENDER'S BACKGROUND (reference 1-2 specific things in paragraph 2):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fullContext}
${extraNotes ? `\nExtra guidance: ${extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO WRITE THIS EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tone to channel: Think of a senior engineer who has been building software for 20 years. They write clean, direct prose. No filler. No begging. They know their worth. The email should feel like it was written by a real human, not generated by a machine.

Paragraph 1 — The Hook (2-3 sentences):
  Start with: "${greeting}"
  Mention something SPECIFIC about ${companyName} — their product, mission, tech stack, or the problem they're solving. Make it clear you know what they do.
  DO NOT start with "I" as the very first word.

Paragraph 2 — The Evidence (2-3 sentences):
  Pick 1-2 things from the sender's background that directly connect to ${companyName}'s work.
  Mention a real project or outcome. Be specific, not vague.
  Naturally work in the role: "${role || 'SDE'}"

Paragraph 3 — The Ask (1-2 sentences MAX):
  Direct, clean, no desperation. GOOD examples:
  - "If there's a ${role || 'SDE'} opening, I'd like to be considered."
  - "Happy to share more of my work if there's a fit."
  - "Let me know if it makes sense to connect."
  BANNED FOREVER: "Would you love to have a quick chat?", "I would welcome the opportunity", "Looking forward to hearing from you"

Signature — use EXACTLY:
${senderSignature || senderName || 'Gaurav Jain'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES (violating = failure):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ No: "I hope this email finds you well", "I am writing to", "Thank you for your time", "I would welcome the opportunity", "I have attached my resume"
❌ No placeholder brackets: [Name], [Company], [Your Name]
❌ No corporate jargon: leverage, synergies, circle back, touch base, paradigm
❌ No subject line inside the body
❌ No more than 3 paragraphs, no padding, no fluff
❌ Body must be under 140 words

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT LINE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate a subject line that feels like a human wrote it — specific, not generic.
Must include the role "${role || 'SDE'}" and the sender's name.
Examples of GOOD subject lines:
  - "${role || 'SDE'} – ${senderName || 'Gaurav Jain'}"
  - "Exploring ${role || 'SDE'} at ${companyName} | ${senderName || 'Gaurav Jain'}"
  - "${senderName || 'Gaurav Jain'} – ${role || 'SDE'} at ${companyName}"
Keep under 65 characters.

Return ONLY valid JSON — no explanation, no markdown, nothing else:
{"subject": "...", "body": "..."}`;

    try {
      const response = await this.generate(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.subject && parsed.body) return parsed;
      }
    } catch (err: any) {
      logger.warn(`JSON parse failed for ${companyName}, using fallback:`, err.message);
    }

    // Fallback: generate body only, role-inclusive subject
    const body = await this.generate(
      `Write a short personalized cold email from ${senderName || 'Gaurav Jain'} to ${companyName}. Context: ${fullContext}. Mention the role "${role || 'SDE'}" naturally. Start with "${greeting}". End with: ${senderSignature || senderName || 'Gaurav Jain'}. Keep under 130 words. No subject line. Sound like a real human — confident, direct, no filler phrases.`
    );
    return {
      subject: `${role || 'SDE'} – ${senderName || 'Gaurav Jain'} for ${companyName}`,
      body,
    };
  }

  // ─── AI-powered company+email parser ─────────────────────────────────────────
  async parseCompanyEmails(rawText: string): Promise<Array<{ name: string; email: string }>> {
    const prompt = `You are a data extractor. Extract every company name + email address pair from the text below.

The user may paste in ANY format. Here are examples you MUST handle:
- "https://inboxpilot-ai.vercel.app/ | jaingaurav906@gmail.com" -> name: "InboxPilot AI", email: "jaingaurav906@gmail.com"
- "https://stocksathi.vercel.app/ | gj569161@gmail.com" -> name: "StockSathi", email: "gj569161@gmail.com"
- "KPMG, siddharthakundu@kpmg.com" -> name: "KPMG", email: "siddharthakundu@kpmg.com"
- "Deloitte - satjha@deloitte.com" -> name: "Deloitte", email: "satjha@deloitte.com"
- "recruiter@tcs.com TCS" -> name: "TCS", email: "recruiter@tcs.com"
- "hr@accenture.com" (no company on the line) -> derive name from email domain: "Accenture"

Rules for deriving company name from a URL like "https://stocksathi.vercel.app/":
- Extract the subdomain before .vercel.app, .netlify.app, etc: "stocksathi" -> "StockSathi"
- Split on hyphens and title-case each word: "inbox-pilot-ai" -> "Inbox Pilot AI"

Rules for deriving company name from email domain like "@kpmg.com":
- Use the domain name title-cased: "kpmg" -> "KPMG"

NEVER leave name blank. NEVER return duplicates. Only return pairs where there is a valid email.

Text to parse:
${rawText}

Return ONLY a valid JSON array with no extra text:
[{"name": "CompanyName", "email": "email@example.com"}]`;

    try {
      const response = await this.generate(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => p.name && p.email && p.email.includes('@'));
        }
      }
    } catch (err: any) {
      logger.warn('AI company parsing failed, falling back to regex:', err.message);
    }

    // Regex fallback
    const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const results: Array<{ name: string; email: string }> = [];
    for (const line of lines) {
      const emails = line.match(emailRe);
      if (!emails) continue;
      const email = emails[0].toLowerCase();
      const urlMatch = line.match(/https?:\/\/([^/\s|,]+)/);
      let name = '';
      if (urlMatch) {
        const host = urlMatch[1];
        const sub = host.replace(/\.(vercel|netlify|herokuapp|render)\.app$/, '').replace(/\.(com|in|io|net|org|co)$/, '');
        name = sub.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      } else {
        name = line.replace(email, '').replace(/[|\-,]/g, '').trim();
        if (!name) {
          const domain = email.split('@')[1]?.split('.')[0] || 'Company';
          name = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }
      results.push({ name: name.trim(), email });
    }
    return results;
  }
}
