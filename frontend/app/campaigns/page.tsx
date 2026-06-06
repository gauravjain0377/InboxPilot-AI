'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/axios';
import {
  Megaphone, FileText, Upload, AlertCircle, CheckCircle2, Loader2,
  Info, Send, Sparkles, ChevronRight, X, Users, Paperclip,
  Image as ImageIcon, File, Building2, Eye, Zap, BookOpen,
  Trash2, Plus, RefreshCw, Save,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'direct' | 'ai' | 'personalized';

interface AttachedFile { file: File; id: string; }
interface CompanyPair { name: string; email: string; id: string; }

interface SenderOptions {
  greeting: string;
  customGreeting: string;
  senderName: string;
  senderTitle: string;
  senderSignature: string;
  role: string;
  tone: 'professional' | 'friendly' | 'concise' | 'assertive';
  extraNotes: string;
}

interface CampaignTemplate {
  _id: string;
  name: string;
  mode: Mode;
  subject?: string;
  body?: string;
  context?: string;
  greeting?: string;
  senderName?: string;
  senderTitle?: string;
  senderSignature?: string;
  role?: string;
  tone?: string;
  extraNotes?: string;
  usedCount: number;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const FileIconComp = ({ mime }: { mime: string }) =>
  mime.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-gray-500" /> : <File className="h-4 w-4 text-gray-500" />;

const GREETING_PRESETS = [
  'Hi,', 'Hello,', 'Dear Hiring Team,', 'Hello Team,',
  'Hi Hiring Manager,', 'Dear Recruiter,', 'Hey,', 'Custom',
];

const inputCls = "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white";

// Parse "Company | email" lines
// Legacy regex fallback (used only if AI call fails client-side)
function fallbackParseCompanies(text: string): CompanyPair[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const pairs: CompanyPair[] = [];
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
  for (const line of lines) {
    const emailMatch = line.match(emailRe);
    if (!emailMatch) continue;
    const email = emailMatch[0].toLowerCase();
    const urlMatch = line.match(/https?:\/\/([^/\s|,]+)/);
    let name = '';
    if (urlMatch) {
      const host = urlMatch[1];
      const sub = host.replace(/\.(vercel|netlify|herokuapp|render)\.app$/, '').replace(/\.(com|in|io|net|org|co)$/, '');
      name = sub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else {
      name = line.replace(email, '').replace(/[|\-,]/g, '').trim();
      if (!name) {
        const domain = email.split('@')[1]?.split('.')[0] || 'Company';
        name = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }
    pairs.push({ name: name.trim(), email, id: `${name}-${email}-${Math.random()}` });
  }
  return pairs;
}

const modeLabel = (m: Mode) =>
  m === 'direct' ? '✍️ Direct' : m === 'ai' ? '✨ AI' : '🏢 Personalized';

// ─── Template Library Drawer ──────────────────────────────────────────────────
function TemplateDrawer({
  open, onClose, onLoad,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (t: CampaignTemplate) => void;
}) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns/templates');
      setTemplates(res.data.templates || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) fetchTemplates(); }, [open, fetchTemplates]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/campaigns/templates/${id}`);
      setTemplates(p => p.filter(t => t._id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  const handleLoad = async (t: CampaignTemplate) => {
    try { await api.post(`/campaigns/templates/${t._id}/use`); } catch { /* ignore */ }
    onLoad(t);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Template Library</h2>
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{templates.length}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No templates yet</p>
              <p className="text-xs text-gray-400 mt-1">Save a campaign as a template to reuse it here</p>
            </div>
          ) : (
            templates.map(t => (
              <div key={t._id} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{modeLabel(t.mode)}</span>
                      {t.usedCount > 0 && (
                        <span className="text-xs text-gray-400">Used {t.usedCount}×</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(t._id)}
                    disabled={deleting === t._id}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deleting === t._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                {t.subject && (
                  <p className="text-xs text-gray-500 truncate mb-2">
                    <span className="text-gray-400">Subject:</span> {t.subject}
                  </p>
                )}
                {(t.context || t.body) && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                    {(t.context || t.body || '').slice(0, 100)}…
                  </p>
                )}

                <button
                  onClick={() => handleLoad(t)}
                  className="w-full py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
                >
                  Load Template
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <button onClick={fetchTemplates} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Save Template Modal ───────────────────────────────────────────────────────
function SaveTemplateModal({
  open, onClose, onSave, mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  mode: Mode | null;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save template.');
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Save className="h-5 w-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Save as Template</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name</label>
          <input
            type="text" autoFocus className={inputCls}
            placeholder={`e.g. "SDE Intern Cold Email" or "Startup Outreach"`}
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<Mode | null>(null);

  // Recipients
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Company pairs
  const [companyRawText, setCompanyRawText] = useState('');
  const [companyPairs, setCompanyPairs] = useState<CompanyPair[]>([]);

  // Content
  const [subject, setSubject] = useState('');
  const [directBody, setDirectBody] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [personContext, setPersonContext] = useState('');

  // Sender
  const [sender, setSender] = useState<SenderOptions>({
    greeting: 'Hi,', customGreeting: '',
    senderName: '', senderTitle: '', senderSignature: '',
    role: '', tone: 'professional', extraNotes: '',
  });

  // Follow-up intentionally removed from campaign — inbox follow-up feature still works

  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Preview
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; body: string; companyInfo: string } | null>(null);

  // Template library
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // State
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateSender = (k: keyof SenderOptions, v: string) =>
    setSender(prev => ({ ...prev, [k]: v }));

  const effectiveGreeting = sender.greeting === 'Custom' ? sender.customGreeting : sender.greeting;

  // ── Load template ────────────────────────────────────────────────────────────
  const loadTemplate = (t: CampaignTemplate) => {
    setMode(t.mode);
    setStep(1);
    if (t.subject) setSubject(t.subject);
    if (t.body) setDirectBody(t.body);
    if (t.context) {
      if (t.mode === 'ai') setAiContext(t.context);
      else setPersonContext(t.context);
    }
    setSender(prev => ({
      ...prev,
      greeting: t.greeting || 'Hi,',
      customGreeting: '',
      senderName: t.senderName || prev.senderName,
      senderTitle: t.senderTitle || prev.senderTitle,
      senderSignature: t.senderSignature || prev.senderSignature,
      role: t.role || prev.role,
      tone: (t.tone as any) || prev.tone,
      extraNotes: t.extraNotes || prev.extraNotes,
    }));
  };

  // ── Save template ────────────────────────────────────────────────────────────
  const handleSaveTemplate = async (name: string) => {
    const payload: any = { name, mode };
    if (subject) payload.subject = subject;
    if (mode === 'direct' && directBody) payload.body = directBody;
    if (mode === 'ai' && aiContext) payload.context = aiContext;
    if (mode === 'personalized' && personContext) payload.context = personContext;
    payload.greeting = effectiveGreeting;
    payload.senderName = sender.senderName;
    payload.senderTitle = sender.senderTitle;
    payload.senderSignature = sender.senderSignature;
    payload.role = sender.role;
    payload.tone = sender.tone;
    payload.extraNotes = sender.extraNotes;
    await api.post('/campaigns/templates', payload);
  };

  const resetAll = () => {
    setStep(1); setMode(null);
    setFile(null); setRawText(''); setEmails([]);
    setCompanyRawText(''); setCompanyPairs([]);
    setSubject(''); setDirectBody(''); setAiContext(''); setPersonContext('');
    setAttachedFiles([]); setPreview(null);
    setError(null); setSuccessMsg(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  // ── Attachments ───────────────────────────────────────────────────────────────
  const handleAddAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const nf = Array.from(e.target.files).map(f => ({ file: f, id: `${f.name}-${f.size}-${Date.now()}` }));
    setAttachedFiles(prev => {
      const ex = new Set(prev.map(a => `${a.file.name}-${a.file.size}`));
      return [...prev, ...nf.filter(f => !ex.has(`${f.file.name}-${f.file.size}`))];
    });
    if (attachInputRef.current) attachInputRef.current.value = '';
  };

  // ── Extract emails ─────────────────────────────────────────────────────────
  const handleExtractEmails = async () => {
    setError(null);
    if (!file && !rawText.trim()) { setError('Please upload a PDF or paste text.'); return; }
    setIsExtracting(true);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      else fd.append('text', rawText);
      const res = await api.post('/campaigns/extract-emails', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.emails?.length > 0) setEmails(res.data.emails);
      else setError('No valid emails found.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extract emails.');
    } finally { setIsExtracting(false); }
  };

  // ── Parse company pairs via AI ────────────────────────────────────────────
  const handleParseCompanies = async () => {
    if (!companyRawText.trim()) { setError('Please paste your company list first.'); return; }
    setIsExtracting(true); setError(null);
    try {
      const res = await api.post('/campaigns/parse-companies', { text: companyRawText });
      const parsed: Array<{ name: string; email: string }> = res.data.companies || [];
      if (!parsed.length) { setError('No valid company + email pairs found. Make sure each line has an email address.'); return; }
      setCompanyPairs(parsed.map(p => ({ ...p, id: `${p.name}-${p.email}-${Math.random()}` })));
    } catch {
      // Fallback to local regex if API fails
      const pairs = fallbackParseCompanies(companyRawText);
      if (!pairs.length) { setError('No valid company+email pairs found.'); return; }
      setCompanyPairs(pairs);
    } finally { setIsExtracting(false); }
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!companyPairs.length) { setError('Add companies first.'); return; }
    setPreviewLoading(true); setPreview(null); setError(null);
    try {
      const res = await api.post('/campaigns/preview-personalized', {
        companyName: companyPairs[0].name, recipientEmail: companyPairs[0].email,
        context: personContext, greeting: effectiveGreeting,
        senderName: sender.senderName, senderTitle: sender.senderTitle,
        senderSignature: sender.senderSignature, role: sender.role,
        tone: sender.tone, extraNotes: sender.extraNotes,
      });
      setPreview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Preview failed.');
    } finally { setPreviewLoading(false); }
  };

  // ── Launch ────────────────────────────────────────────────────────────────
  const handleStartCampaign = async () => {
    setError(null); setSuccessMsg(null); setIsStarting(true);
    try {
      const fd = new FormData();
      for (const att of attachedFiles) fd.append('attachments', att.file, att.file.name);

      if (mode === 'personalized') {
        if (!personContext.trim()) { setError('Please provide your context.'); setIsStarting(false); return; }
        fd.append('companies', JSON.stringify(companyPairs.map(p => ({ name: p.name, email: p.email }))));
        fd.append('context', personContext);
        fd.append('greeting', effectiveGreeting);
        fd.append('senderName', sender.senderName);
        fd.append('senderTitle', sender.senderTitle);
        fd.append('senderSignature', sender.senderSignature);
        fd.append('role', sender.role);
        fd.append('tone', sender.tone);
        fd.append('extraNotes', sender.extraNotes);
        const res = await api.post('/campaigns/send-personalized', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccessMsg(res.data.message);
      } else {
        if (!subject.trim()) { setError('Please enter a subject.'); setIsStarting(false); return; }
        if (mode === 'direct' && !directBody.trim()) { setError('Please enter the email body.'); setIsStarting(false); return; }
        if (mode === 'ai' && !aiContext.trim()) { setError('Please provide context.'); setIsStarting(false); return; }
        fd.append('emails', JSON.stringify(emails));
        fd.append('subject', subject);
        fd.append('mode', mode!);
        fd.append('isPersonalized', 'false');
        if (mode === 'direct') fd.append('directBody', directBody);
        else {
          const ctx = `Context: ${aiContext}\nGreeting: ${effectiveGreeting}\nSender: ${sender.senderName}, ${sender.senderTitle}\nRole: ${sender.role}\nTone: ${sender.tone}\nNotes: ${sender.extraNotes}\nSignature:\n${sender.senderSignature || sender.senderName}\nStart with "${effectiveGreeting}" and end with the exact signature above.`;
          fd.append('context', ctx);
        }
        const res = await api.post('/campaigns/send', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccessMsg(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start campaign.');
    } finally { setIsStarting(false); }
  };

  const canStep1 = mode === 'personalized' ? companyPairs.length > 0 : emails.length > 0;
  const canStep2 = mode !== null && (
    mode === 'direct' ? subject.trim().length > 0 && directBody.trim().length > 0 :
    mode === 'ai' ? subject.trim().length > 0 && aiContext.trim().length > 0 :
    personContext.trim().length > 0
  );
  const totalRecipients = mode === 'personalized' ? companyPairs.length : emails.length;

  const steps = [
    { n: 1, label: mode === 'personalized' ? 'Companies' : 'Recipients' },
    { n: 2, label: 'Email Content' },
    { n: 3, label: 'Launch' },
  ];

  // ─── Sub-components ─────────────────────────────────────────────────────────
  const AttachmentZone = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Attach Files <span className="text-gray-400 font-normal">(resume, portfolio, docs…)</span>
        </label>
        <button type="button" onClick={() => attachInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">
          <Paperclip className="h-3.5 w-3.5" /> Add
        </button>
        <input ref={attachInputRef} type="file" multiple className="hidden" accept="*/*" onChange={handleAddAttachments} />
      </div>
      {attachedFiles.length > 0 ? (
        <div className="space-y-1.5">
          {attachedFiles.map(att => (
            <div key={att.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <FileIconComp mime={att.file.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate font-medium">{att.file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(att.file.size)}</p>
              </div>
              <button onClick={() => setAttachedFiles(p => p.filter(a => a.id !== att.id))} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={() => attachInputRef.current?.click()} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add more
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => attachInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all">
          <Paperclip className="h-4 w-4" /> Click to attach files
        </button>
      )}
    </div>
  );

  const GreetingSelector = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Greeting</label>
      <div className="flex flex-wrap gap-2">
        {GREETING_PRESETS.map(g => (
          <button key={g} type="button" onClick={() => updateSender('greeting', g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              sender.greeting === g
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-600'
            }`}>
            {g}
          </button>
        ))}
      </div>
      {sender.greeting === 'Custom' && (
        <input type="text" className={inputCls} placeholder='e.g. Hello TCS Team, or Good Morning,'
          value={sender.customGreeting} onChange={e => updateSender('customGreeting', e.target.value)} />
      )}
    </div>
  );

  const SenderFields = () => (
    <div className="space-y-4">
      {GreetingSelector()}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
          <input type="text" className={inputCls} placeholder="Gaurav Jain"
            value={sender.senderName} onChange={e => updateSender('senderName', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Title</label>
          <input type="text" className={inputCls} placeholder="CS Student | B.Tech 2025"
            value={sender.senderTitle} onChange={e => updateSender('senderTitle', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Applying For</label>
          <input type="text" className={inputCls} placeholder="SDE1 / SDE Intern"
            value={sender.role} onChange={e => updateSender('role', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
          <select className={inputCls} value={sender.tone} onChange={e => updateSender('tone', e.target.value)}>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="concise">Concise / Short</option>
            <option value="assertive">Assertive / Bold</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Signature <span className="text-gray-400 font-normal">(appears at bottom of every email)</span>
        </label>
        <textarea rows={3} className={inputCls + ' font-mono resize-none'}
          placeholder={`Gaurav Jain\nCS Student | B.Tech 2025\n+91 9876543210 | linkedin.com/in/gaurav`}
          value={sender.senderSignature} onChange={e => updateSender('senderSignature', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Extra Notes (optional)</label>
        <input type="text" className={inputCls}
          placeholder="e.g. mention GitHub, keep under 120 words, reference their tech stack…"
          value={sender.extraNotes} onChange={e => updateSender('extraNotes', e.target.value)} />
      </div>
    </div>
  );

  const FollowUpToggle = () => (
    <div className={`rounded-xl border-2 p-4 transition-all ${followUpEnabled ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${followUpEnabled ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <Clock className={`h-4 w-4 ${followUpEnabled ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Auto Follow-up</p>
            <p className="text-xs text-gray-500">Send a follow-up if no reply received</p>
          </div>
        </div>
        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => setFollowUpEnabled(p => !p)}
          className={`relative w-11 h-6 rounded-full transition-colors ${followUpEnabled ? 'bg-gray-900' : 'bg-gray-300'}`}
        >
          <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${followUpEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {followUpEnabled && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send follow-up after</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 7].map(d => (
                <button key={d} type="button" onClick={() => setFollowUpDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    followUpDays === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
            If no reply in {followUpDays} days, a short follow-up goes automatically using the existing Gmail follow-up system. You can manage or cancel it from the Dashboard.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <TemplateDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLoad={loadTemplate} />
      <SaveTemplateModal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} onSave={handleSaveTemplate} mode={mode} />

      <AppShell>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                  <Megaphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cold Email Campaigns</h1>
                  <p className="text-sm text-gray-500">Send personalized bulk emails - automatically.</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                <BookOpen className="h-4 w-4" /> Templates
              </button>
            </div>

            {/* Mode Selector */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {([
                  { id: 'direct' as Mode, icon: Send, label: 'Direct Send', sub: 'Same email to everyone', desc: 'Write your exact email. Zero AI. Sent as-is to all recipients.' },
                  { id: 'ai' as Mode, icon: Sparkles, label: 'AI Generate', sub: 'One context → one template', desc: 'AI writes one professional email. Same version goes to all.' },
                  { id: 'personalized' as Mode, icon: Building2, label: 'Personalized', sub: 'Per-company unique emails', desc: 'AI researches each company\'s website and writes a unique email per company.' },
                ]).map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setError(null); }}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      mode === m.id ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === m.id ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <m.icon className={`h-4 w-4 ${mode === m.id ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                        <p className="text-xs text-gray-500">{m.sub}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                    {m.id === 'personalized' && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md px-2 py-0.5">
                        <Zap className="h-3 w-3" /> Most effective
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    step === s.n ? 'bg-gray-900 text-white' :
                    step > s.n ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? 'bg-white/20' : 'bg-gray-200'}`}>
                      {step > s.n ? '✓' : s.n}
                    </span>
                    {s.label}
                  </div>
                  {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
                </div>
              ))}
            </div>

            {/* ── STEP 1: Recipients ─────────────────────────────────────────── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                  {mode === 'personalized' ? <Building2 className="h-5 w-5 text-gray-700" /> : <Users className="h-5 w-5 text-gray-700" />}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {mode === 'personalized' ? 'Add Companies & Emails' : 'Add Recipients'}
                  </h2>
                </div>

                <div className="p-6 space-y-5">
                  {/* Personalized */}
                  {mode === 'personalized' && (
                    <>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 space-y-2">
                        <p className="font-medium text-gray-800">Paste in ANY format - AI figures it out:</p>
                        <code className="block text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 font-mono leading-relaxed">
                          https://inboxpilot-ai.vercel.app/ | jaingaurav906@gmail.com<br />
                          KPMG | siddharthakundu@kpmg.com<br />
                          Deloitte, satjha@deloitte.com<br />
                          recruiter@tcs.com TCS<br />
                          hr@accenture.com
                        </code>
                        <p className="text-xs text-gray-500">URLs, company names, any separator - AI extracts the right name and email from each line.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company + Email List</label>
                        <textarea rows={10} className={inputCls + ' font-mono resize-none'}
                          placeholder={'https://inboxpilot-ai.vercel.app/ | jaingaurav906@gmail.com\nKPMG | siddharthakundu@kpmg.com\nDeloitte, satjha@deloitte.com\nrecruiter@tcs.com'}
                          value={companyRawText}
                          onChange={e => { setCompanyRawText(e.target.value); setCompanyPairs([]); }} />

                      </div>
                      {error && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
                      {companyPairs.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-800">✓ {companyPairs.length} companies parsed</p>
                            <button onClick={() => setCompanyPairs([])} className="text-xs text-gray-500 hover:text-gray-800">Clear</button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {companyPairs.map((p, idx) => (
                              <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100 text-sm">
                                <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}</span>
                                <span className="font-medium text-gray-800 w-28 shrink-0 truncate">{p.name}</span>
                                <span className="text-gray-500 truncate flex-1">{p.email}</span>
                                <button onClick={() => setCompanyPairs(prev => prev.filter(c => c.id !== p.id))} className="text-gray-300 hover:text-red-500 shrink-0"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button onClick={handleParseCompanies} disabled={!companyRawText.trim() || isExtracting}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40">
                          {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                          {isExtracting ? 'AI Parsing…' : 'Parse with AI'}
                        </button>
                        <button onClick={() => { setError(null); setStep(2); }} disabled={!canStep1}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 ml-auto">
                          Continue <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Direct / AI */}
                  {(mode === 'direct' || mode === 'ai') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF or Image</label>
                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          file ? 'border-gray-400 bg-gray-50' : 'border-gray-300 bg-gray-50 hover:border-gray-500'
                        }`}>
                          {file ? (
                            <div className="text-center"><FileText className="mx-auto h-7 w-7 text-gray-600 mb-1" /><p className="text-sm font-semibold text-gray-800">{file.name}</p><p className="text-xs text-gray-500">Click to change</p></div>
                          ) : (
                            <div className="text-center"><Upload className="mx-auto h-7 w-7 text-gray-400 mb-1" /><p className="text-sm text-gray-600"><span className="font-medium">Click to upload</span> or drag & drop</p><p className="text-xs text-gray-400">PDF or image - AI extracts all emails</p></div>
                          )}
                          <input ref={pdfInputRef} type="file" className="hidden" accept=".pdf,image/*"
                            onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setRawText(''); setEmails([]); } }} />
                        </label>
                        {file && <button onClick={() => { setFile(null); setEmails([]); if (pdfInputRef.current) pdfInputRef.current.value = ''; }} className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><X className="h-3 w-3" /> Remove</button>}
                      </div>
                      <div className="flex items-center gap-3"><div className="flex-1 border-t border-gray-200" /><span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span><div className="flex-1 border-t border-gray-200" /></div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Paste emails or any text</label>
                        <textarea rows={5} className={inputCls + ' resize-none'}
                          placeholder="hr@kpmg.com, recruiter@deloitte.com&#10;Or paste any text - we extract every email."
                          value={rawText} onChange={e => { setRawText(e.target.value); if (e.target.value) { setFile(null); setEmails([]); } }} disabled={!!file} />
                      </div>
                      {error && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
                      {emails.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-800">✓ {emails.length} emails found</p>
                            <button onClick={() => setEmails([])} className="text-xs text-gray-500 hover:text-gray-800">Clear</button>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1">
                            {emails.map((e, i) => (
                              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700 border border-gray-100">
                                <span className="truncate">{e}</span>
                                <button onClick={() => setEmails(p => p.filter((_, idx) => idx !== i))} className="ml-2 text-gray-400 hover:text-red-500 shrink-0"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button onClick={handleExtractEmails} disabled={isExtracting || (!file && !rawText.trim())}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40">
                          {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                          {isExtracting ? 'Extracting…' : 'Extract Emails'}
                        </button>
                        <button onClick={() => { setError(null); setStep(2); }} disabled={!canStep1}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 ml-auto">
                          Continue <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {!mode && (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      Select a mode above to get started
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Content ────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {mode === 'direct' ? '✍️ Write Your Email' : mode === 'ai' ? '✨ AI Email Details' : '🏢 Personalized Campaign'}
                      </h2>
                      {mode === 'personalized' && (
                        <p className="text-xs text-gray-500 mt-0.5">AI researches each of your {companyPairs.length} companies and writes a unique email per company.</p>
                      )}
                    </div>
                    {/* Save as template */}
                    {mode && (
                      <button onClick={() => setSaveModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-all">
                        <Save className="h-3.5 w-3.5" /> Save as Template
                      </button>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Direct */}
                    {mode === 'direct' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line <span className="text-red-500">*</span></label>
                          <input type="text" className={inputCls} placeholder="e.g. Application for SDE1 - Gaurav Jain"
                            value={subject} onChange={e => setSubject(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Body <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(sent exactly as written)</span></label>
                          <textarea rows={12} className={inputCls + ' font-mono resize-none'}
                            placeholder={'Hi,\n\nI am interested in SDE1 opportunities...\n\nBest,\nGaurav Jain'}
                            value={directBody} onChange={e => setDirectBody(e.target.value)} />
                          <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-xs">
                            <Info className="h-4 w-4 shrink-0" /> Sent exactly as-is to all {emails.length} recipients. No AI changes.
                          </div>
                        </div>
                      </>
                    )}

                    {/* AI */}
                    {mode === 'ai' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line <span className="text-red-500">*</span></label>
                          <input type="text" className={inputCls} placeholder="e.g. SDE Intern - Gaurav Jain (B.Tech 2025)"
                            value={subject} onChange={e => setSubject(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Context <span className="text-red-500">*</span></label>
                          <textarea rows={4} className={inputCls + ' resize-none'}
                            placeholder="I'm a 4th year B.Tech CS student. Skills: React, Node.js, Python. Built 3 production projects…"
                            value={aiContext} onChange={e => setAiContext(e.target.value)} />
                        </div>
                        {SenderFields()}
                      </>
                    )}

                    {/* Personalized */}
                    {mode === 'personalized' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Background & Context <span className="text-red-500">*</span></label>
                          <textarea rows={5} className={inputCls + ' resize-none'}
                            placeholder="I'm a 4th year B.Tech CS student from PCE Jaipur. Skills: React, Node.js, Python, MongoDB. Built InboxPilot AI (AI email manager), a fintech app, a real-time chat app. Looking for SDE1 / intern roles in product companies…"
                            value={personContext} onChange={e => setPersonContext(e.target.value)} />
                        </div>
                        {SenderFields()}

                        {/* Preview */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-800">Email Preview</p>
                              <p className="text-xs text-gray-500">See how it looks for <strong>{companyPairs[0]?.name}</strong></p>
                            </div>
                            <button onClick={handlePreview} disabled={previewLoading || !personContext.trim()}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                              {previewLoading ? 'Generating…' : 'Preview'}
                            </button>
                          </div>
                          {preview && (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What AI found about {companyPairs[0]?.name}</span>
                                <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                              </div>
                              <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100">{preview.companyInfo}</p>
                              <div className="border-t border-gray-200 pt-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                                <p className="text-sm font-medium text-gray-800">{preview.subject}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Body</p>
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-white p-3 rounded-lg border border-gray-100 max-h-48 overflow-y-auto">{preview.body}</pre>
                              </div>
                              <p className="text-xs text-gray-500">Each of your {companyPairs.length} companies gets a unique version like this.</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Attachments */}
                    <div className="pt-2 border-t border-gray-100">{AttachmentZone()}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); setError(null); setPreview(null); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    ← Back
                  </button>
                  <button onClick={() => { setError(null); setStep(3); }} disabled={!canStep2}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 ml-auto">
                    Review <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review & Launch ────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Review & Launch</h2>
                  </div>
                  <div className="p-6 space-y-5">

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-900 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-white">{totalRecipients}</p>
                        <p className="text-xs text-gray-300 mt-1">{mode === 'personalized' ? 'Companies' : 'Recipients'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                        <p className="text-sm font-bold text-gray-800">{mode ? modeLabel(mode) : '-'}</p>
                        <p className="text-xs text-gray-500 mt-1">Mode</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                        <p className="text-sm font-bold text-gray-800">{attachedFiles.length > 0 ? `${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''}` : 'None'}</p>
                        <p className="text-xs text-gray-500 mt-1">Attachments</p>
                      </div>
                    </div>

                    {/* Subject */}
                    {subject && (
                      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                        <p className="text-sm text-gray-800 font-medium">{subject}</p>
                      </div>
                    )}

                    {/* Direct body */}
                    {mode === 'direct' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Body (sent as-is)</p>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">{directBody}</pre>
                      </div>
                    )}

                    {/* Company list for personalized */}
                    {mode === 'personalized' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Companies ({companyPairs.length})</p>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {companyPairs.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-1.5 text-sm border border-gray-100">
                              <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                              <span className="font-medium text-gray-800 w-24 shrink-0 truncate">{p.name}</span>
                              <span className="text-gray-500 truncate">{p.email}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">✓ Each company gets a unique personalized email researched by AI.</p>
                      </div>
                    )}

                    {/* Attachments review */}
                    {attachedFiles.length > 0 && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attachments</p>
                        <div className="space-y-1.5">
                          {attachedFiles.map(att => (
                            <div key={att.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                              <FileIconComp mime={att.file.type} />
                              <span className="text-sm text-gray-700 truncate flex-1">{att.file.name}</span>
                              <span className="text-xs text-gray-400">{formatBytes(att.file.size)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                    {/* Safety notice */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <Info className="h-5 w-5 shrink-0 mt-0.5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Gmail Safety Limits Active</p>
                        <p className="text-xs mt-0.5 text-gray-600">
                          Sending at <strong>50 emails/hour</strong>.
                          {' '}{totalRecipients} {mode === 'personalized' ? 'companies' : 'recipients'} →
                          ~{Math.ceil(totalRecipients / 50) <= 1 ? 'under an hour' : `${Math.ceil(totalRecipients / 50)} hours`}.
                          {mode === 'personalized' && ' Company research + email generation runs in background.'}
                          {' '}Safe to close the page after launch.
                        </p>
                      </div>
                    </div>

                    {error && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
                    {successMsg && (
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-gray-900 text-white">
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Campaign Launched! 🚀</p>
                          <p className="text-xs mt-0.5 text-gray-300">{successMsg}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {!successMsg && (
                    <button onClick={() => { setStep(2); setError(null); }}
                      className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      ← Back
                    </button>
                  )}
                  {successMsg ? (
                    <button onClick={resetAll}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 ml-auto">
                      Start New Campaign
                    </button>
                  ) : (
                    <button onClick={handleStartCampaign} disabled={isStarting}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 shadow-sm ml-auto">
                      {isStarting
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Launching…</>
                        : <><Megaphone className="h-4 w-4" /> Launch ({totalRecipients} emails)</>}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </AppShell>
    </>
  );
}
