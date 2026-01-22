'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Send,
  Wand2,
  Sparkles,
  Loader2,
  X,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';

type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  
  const [sending, setSending] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone>('friendly');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Pre-fill from URL params (for reply flow)
    const replyTo = searchParams.get('replyTo');
    const replySubject = searchParams.get('subject');
    
    if (replyTo) setTo(replyTo);
    if (replySubject) setSubject(replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`);
  }, [user, router, searchParams]);

  const enhanceWithAI = async () => {
    if (!body.trim()) {
      setError('Please write some content first');
      return;
    }
    
    try {
      setEnhancing(true);
      setError(null);
      
      const { data } = await api.post('/ai/rewrite', {
        text: body,
        instruction: `Enhance and improve this email to be more ${selectedTone}. Make it clear, professional, and well-structured. Keep the same meaning but improve the writing.`,
      });
      
      setAiSuggestion(data.rewritten);
    } catch (err: any) {
      console.error('Error enhancing email:', err);
      setError(err?.response?.data?.message || 'Failed to enhance email');
    } finally {
      setEnhancing(false);
    }
  };

  const useSuggestion = () => {
    if (aiSuggestion) {
      setBody(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const sendEmail = async () => {
    if (!to.trim()) {
      setError('Please enter a recipient');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!body.trim()) {
      setError('Please write your message');
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      
      await api.post('/gmail/send', {
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });
      
      setSuccess(true);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/inbox');
      }, 1500);
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(err?.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">New Message</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={enhanceWithAI}
              disabled={enhancing || !body.trim()}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {enhancing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              AI Enhance
            </Button>
            <Button
              size="sm"
              onClick={sendEmail}
              disabled={sending || success}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : success ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sending ? 'Sending...' : success ? 'Sent!' : 'Send'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Email sent successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Compose Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Recipients */}
          <div className="border-b border-gray-100">
            <div className="flex items-center px-4 py-3">
              <Label className="w-16 text-sm text-gray-500">To</Label>
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
              />
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cc
                </button>
              )}
            </div>
            
            {showCc && (
              <div className="flex items-center px-4 py-3 border-t border-gray-100">
                <Label className="w-16 text-sm text-gray-500">Cc</Label>
                <Input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
                />
                <button
                  onClick={() => {
                    setShowCc(false);
                    setCc('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="border-b border-gray-100">
            <div className="flex items-center px-4 py-3">
              <Label className="w-16 text-sm text-gray-500">Subject</Label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 font-medium"
              />
            </div>
          </div>

          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-purple-700 mb-2 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Enhanced Version
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiSuggestion}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs h-8"
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={useSuggestion}
                    className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Use This
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              className="w-full min-h-[350px] text-sm text-gray-700 leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* AI Tone Options */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">AI Tone:</span>
                {(['formal', 'friendly', 'assertive', 'short'] as Tone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedTone === tone
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-gray-400">
                {body.length} characters
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for better emails</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Keep your subject line clear and specific</li>
            <li>• Use the AI Enhance button to improve your writing</li>
            <li>• Select a tone that matches your relationship with the recipient</li>
            <li>• Proofread before sending</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <ComposeContent />
    </Suspense>
  );
}
