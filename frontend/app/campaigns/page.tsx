'use client';

import { useState, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/axios';
import {
  Megaphone, FileText, Upload, AlertCircle, CheckCircle2,
  Loader2, Info, Send, Sparkles, ChevronRight, X, Users
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'direct' | 'ai';

interface AIOptions {
  greeting: 'Hi' | 'Hello' | 'Dear' | 'Hey';
  senderName: string;
  senderTitle: string;
  senderSignature: string;
  companyName: string;
  role: string;
  tone: 'professional' | 'friendly' | 'concise' | 'assertive';
  extraNotes: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<Mode | null>(null);

  // Recipients
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Subject
  const [subject, setSubject] = useState('');

  // Mode 1 – Direct
  const [directBody, setDirectBody] = useState('');

  // Mode 2 – AI
  const [aiContext, setAiContext] = useState('');
  const [aiOptions, setAiOptions] = useState<AIOptions>({
    greeting: 'Hi',
    senderName: '',
    senderTitle: '',
    senderSignature: '',
    companyName: '',
    role: '',
    tone: 'professional',
    extraNotes: '',
  });

  // Campaign state
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updateAI = (key: keyof AIOptions, value: string) =>
    setAiOptions(prev => ({ ...prev, [key]: value }));

  const resetAll = () => {
    setStep(1); setMode(null);
    setFile(null); setRawText(''); setEmails([]);
    setSubject(''); setDirectBody(''); setAiContext('');
    setAiOptions({ greeting: 'Hi', senderName: '', senderTitle: '', senderSignature: '', companyName: '', role: '', tone: 'professional', extraNotes: '' });
    setError(null); setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Extract Emails ───────────────────────────────────────────────────────────
  const handleExtractEmails = async () => {
    setError(null);
    if (!file && !rawText.trim()) {
      setError('Please upload a PDF or paste text containing email addresses.');
      return;
    }
    setIsExtracting(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      else formData.append('text', rawText);

      const res = await api.post('/campaigns/extract-emails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.emails?.length > 0) {
        setEmails(res.data.emails);
      } else {
        setError('No valid email addresses found. Please check your input.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extract emails.');
    } finally {
      setIsExtracting(false);
    }
  };

  const removeEmail = (idx: number) => setEmails(prev => prev.filter((_, i) => i !== idx));

  // ── Start Campaign ───────────────────────────────────────────────────────────
  const handleStartCampaign = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!subject.trim()) { setError('Please enter a subject line.'); return; }
    if (mode === 'direct' && !directBody.trim()) { setError('Please enter the email content to send.'); return; }
    if (mode === 'ai' && !aiContext.trim()) { setError('Please provide context for the AI.'); return; }

    setIsStarting(true);
    try {
      // Build context for AI mode
      let context = '';
      if (mode === 'ai') {
        context = `
Context: ${aiContext}
Greeting style: ${aiOptions.greeting}
Sender Name: ${aiOptions.senderName || 'not provided'}
Sender Title: ${aiOptions.senderTitle || 'not provided'}
Company: ${aiOptions.companyName || 'not provided'}
Role applying for: ${aiOptions.role || 'not specified'}
Tone: ${aiOptions.tone}
Additional notes: ${aiOptions.extraNotes || 'none'}
Signature to use at the end:
${aiOptions.senderSignature || `${aiOptions.senderName}${aiOptions.senderTitle ? '\n' + aiOptions.senderTitle : ''}`}

IMPORTANT: Do NOT use any bracketed placeholders like [Name], [Company], [Role]. Use only the information provided above. Start with "${aiOptions.greeting}," and end with the exact signature provided.
        `.trim();
      }

      const res = await api.post('/campaigns/send', {
        emails,
        subject,
        context: mode === 'direct' ? '' : context,
        directBody: mode === 'direct' ? directBody : '',
        isPersonalized: false,
        mode,
      });

      setSuccessMsg(res.data.message || 'Campaign started! Emails are being sent.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start campaign.');
    } finally {
      setIsStarting(false);
    }
  };

  // ── Step indicator ───────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Recipients' },
    { n: 2, label: 'Mode & Content' },
    { n: 3, label: 'Review & Send' },
  ];

  const canProceedStep1 = emails.length > 0;
  const canProceedStep2 =
    mode !== null && subject.trim().length > 0 &&
    (mode === 'direct' ? directBody.trim().length > 0 : aiContext.trim().length > 0);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cold Email Campaigns</h1>
                <p className="text-sm text-gray-500">Send bulk emails to companies, HRs, and recruiters — automatically.</p>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  step === s.n ? 'bg-indigo-600 text-white shadow-sm' :
                  step > s.n ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s.n ? 'bg-white/20' : step > s.n ? 'bg-green-200' : 'bg-gray-200'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </span>
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className={`h-4 w-4 ${step > s.n ? 'text-green-400' : 'text-gray-300'}`} />
                )}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Recipients ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Add Recipients</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">Upload a PDF containing emails, or paste them directly.</p>
              </div>

              <div className="p-6 space-y-6">
                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF</label>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                    }`}
                  >
                    {file ? (
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-indigo-500 mb-2" />
                        <p className="text-sm font-semibold text-indigo-700">{file.name}</p>
                        <p className="text-xs text-indigo-500 mt-1">Click to change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600"><span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF files only, up to 10MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={e => {
                        if (e.target.files?.[0]) { setFile(e.target.files[0]); setRawText(''); setEmails([]); }
                      }}
                    />
                  </label>
                  {file && (
                    <button
                      onClick={() => { setFile(null); setEmails([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove file
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Text paste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste emails or text
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="hr@company.com, recruiter@startup.io&#10;Or paste any text that contains email addresses — we'll extract them automatically."
                    value={rawText}
                    onChange={e => { setRawText(e.target.value); if (e.target.value) { setFile(null); setEmails([]); } }}
                    disabled={!!file}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {/* Extracted emails preview */}
                {emails.length > 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-green-800">
                        ✓ {emails.length} valid email{emails.length > 1 ? 's' : ''} found
                      </p>
                      <button onClick={() => setEmails([])} className="text-xs text-green-600 hover:text-green-800">Clear</button>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {emails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700 border border-green-100">
                          <span className="truncate">{email}</span>
                          <button onClick={() => removeEmail(idx)} className="ml-2 text-gray-400 hover:text-red-500 shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleExtractEmails}
                    disabled={isExtracting || (!file && !rawText.trim())}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Extract Emails
                  </button>
                  <button
                    onClick={() => { setError(null); setStep(2); }}
                    disabled={!canProceedStep1}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Mode & Content ── */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Mode selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Direct Mode */}
                <button
                  onClick={() => setMode('direct')}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    mode === 'direct' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mode === 'direct' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                      <Send className={`h-4 w-4 ${mode === 'direct' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Direct Send</p>
                      <p className="text-xs text-gray-500">Same email to everyone</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    You write the exact email. It goes as-is — <strong>no AI changes</strong>, no corrections, nothing added. Perfect when you already have your cold email ready.
                  </p>
                </button>

                {/* AI Mode */}
                <button
                  onClick={() => setMode('ai')}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    mode === 'ai' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mode === 'ai' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                      <Sparkles className={`h-4 w-4 ${mode === 'ai' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">AI Generate</p>
                      <p className="text-xs text-gray-500">AI writes the email for you</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Give context, your details, and preferences. AI generates a proper, professional email — <strong>no placeholders</strong>, no `[brackets]`.
                  </p>
                </button>
              </div>

              {/* Content area */}
              {mode && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">
                      {mode === 'direct' ? '✍️ Write Your Email' : '🤖 AI Email Details'}
                    </h2>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Subject — always required */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g. Application for SDE1 — Gaurav Jain"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                      />
                    </div>

                    {/* ─ Direct Mode Content ─ */}
                    {mode === 'direct' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email Body <span className="text-red-500">*</span>
                          <span className="ml-2 text-xs font-normal text-gray-400">(sent exactly as written — zero changes)</span>
                        </label>
                        <textarea
                          rows={12}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono resize-none"
                          placeholder={`Hi,\n\nI am writing to express my interest in the SDE1 position at your company...\n\nBest regards,\nGaurav Jain\ngaurav@email.com`}
                          value={directBody}
                          onChange={e => setDirectBody(e.target.value)}
                        />
                        <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                          <Info className="h-4 w-4 shrink-0" />
                          This exact text will be sent to all {emails.length} recipient{emails.length > 1 ? 's' : ''}. No AI will touch it.
                        </div>
                      </div>
                    )}

                    {/* ─ AI Mode Form ─ */}
                    {mode === 'ai' && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Context / Purpose <span className="text-red-500">*</span></label>
                          <textarea
                            rows={4}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="e.g. I'm a final year CS student applying for SDE1 roles. I have experience in React, Node.js, and built 3 projects..."
                            value={aiContext}
                            onChange={e => setAiContext(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Greeting Style</label>
                            <select
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                              value={aiOptions.greeting}
                              onChange={e => updateAI('greeting', e.target.value)}
                            >
                              <option>Hi</option>
                              <option>Hello</option>
                              <option>Dear</option>
                              <option>Hey</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
                            <select
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                              value={aiOptions.tone}
                              onChange={e => updateAI('tone', e.target.value)}
                            >
                              <option value="professional">Professional</option>
                              <option value="friendly">Friendly</option>
                              <option value="concise">Concise / Short</option>
                              <option value="assertive">Assertive / Bold</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="e.g. Gaurav Jain"
                              value={aiOptions.senderName}
                              onChange={e => updateAI('senderName', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Title / Role</label>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="e.g. CS Student | B.Tech 2025"
                            value={aiOptions.senderTitle}
                              onChange={e => updateAI('senderTitle', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Applying For</label>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="e.g. SDE1 / SDE Intern"
                              value={aiOptions.role}
                              onChange={e => updateAI('role', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name (optional)</label>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Leave blank for generic"
                              value={aiOptions.companyName}
                              onChange={e => updateAI('companyName', e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Your Signature
                            <span className="ml-2 text-xs font-normal text-gray-400">(appears at the bottom of every email)</span>
                          </label>
                          <textarea
                            rows={4}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono resize-none"
                            placeholder={`Gaurav Jain\nSoftware Engineer | B.Tech CS 2025\nPhone: +91 9876543210\nLinkedIn: linkedin.com/in/gaurav`}
                            value={aiOptions.senderSignature}
                            onChange={e => updateAI('senderSignature', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Any Extra Notes (optional)</label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g. mention my GitHub portfolio, keep it under 150 words..."
                            value={aiOptions.extraNotes}
                            onChange={e => updateAI('extraNotes', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(null); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => { setError(null); setStep(3); }}
                  disabled={!canProceedStep2}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                >
                  Review Campaign <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review & Send ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Review Your Campaign</h2>
                </div>
                <div className="p-6 space-y-5">

                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                      <p className="text-3xl font-bold text-indigo-600">{emails.length}</p>
                      <p className="text-xs text-indigo-700 font-medium mt-1">Recipients</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                      <p className="text-sm font-bold text-gray-800">
                        {mode === 'direct' ? '✍️ Direct' : '✨ AI'}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Mode</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                      <p className="text-sm font-bold text-green-800">50/hr</p>
                      <p className="text-xs text-green-700 font-medium mt-1">Send Rate</p>
                    </div>
                  </div>

                  {/* Subject preview */}
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-sm text-gray-800 font-medium">{subject}</p>
                  </div>

                  {/* Content preview */}
                  {mode === 'direct' && (
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Body (sent as-is)</p>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{directBody}</pre>
                    </div>
                  )}
                  {mode === 'ai' && (
                    <div className="rounded-xl border border-gray-200 p-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Will Generate Using</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        <div className="flex gap-2"><span className="text-gray-400 w-24">Greeting:</span><span className="text-gray-800">{aiOptions.greeting}</span></div>
                        <div className="flex gap-2"><span className="text-gray-400 w-24">Tone:</span><span className="text-gray-800 capitalize">{aiOptions.tone}</span></div>
                        <div className="flex gap-2"><span className="text-gray-400 w-24">Your Name:</span><span className="text-gray-800">{aiOptions.senderName || '—'}</span></div>
                        <div className="flex gap-2"><span className="text-gray-400 w-24">Role:</span><span className="text-gray-800">{aiOptions.role || '—'}</span></div>
                        <div className="flex gap-2"><span className="text-gray-400 w-24">Company:</span><span className="text-gray-800">{aiOptions.companyName || 'Generic'}</span></div>
                        <div className="flex gap-2"><span className="text-gray-400 w-24">Title:</span><span className="text-gray-800">{aiOptions.senderTitle || '—'}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Rate limit notice */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                    <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-semibold">Gmail Safety Limits Active</p>
                      <p className="text-xs mt-0.5 text-blue-700">
                        Emails are sent in batches of <strong>50 per hour</strong> to keep your account safe. 
                        For {emails.length} recipients, this will take approximately{' '}
                        <strong>{Math.ceil(emails.length / 50) === 1 ? 'under an hour' : `~${Math.ceil(emails.length / 50)} hours`}</strong>.
                        You can close this page after starting.
                      </p>
                    </div>
                  </div>

                  {/* Recipients preview */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recipients ({emails.length})</p>
                    <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                      {emails.map((email, idx) => (
                        <div key={idx} className="px-3 py-2 text-sm text-gray-700 bg-white">{email}</div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="flex items-start gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
                      <div>
                        <p className="font-semibold">Campaign Started!</p>
                        <p className="text-xs mt-0.5 text-green-700">{successMsg}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {!successMsg && (
                  <button
                    onClick={() => { setStep(2); setError(null); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    ← Back
                  </button>
                )}

                {successMsg ? (
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all ml-auto"
                  >
                    Start New Campaign
                  </button>
                ) : (
                  <button
                    onClick={handleStartCampaign}
                    disabled={isStarting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ml-auto"
                  >
                    {isStarting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Launching Campaign...</>
                    ) : (
                      <><Megaphone className="h-4 w-4" /> Launch Campaign ({emails.length} emails)</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
