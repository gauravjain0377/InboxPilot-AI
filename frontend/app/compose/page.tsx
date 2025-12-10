'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, Send, Wand2 } from 'lucide-react';

export default function ComposePage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [tone, setTone] = useState<'formal' | 'friendly' | 'assertive' | 'short'>('friendly');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const generateAISuggestion = async () => {
    if (!body) return;
    try {
      setLoading(true);
      const { data } = await api.post('/ai/rewrite', {
        text: body,
        instruction: `Rewrite this email in a ${tone} tone`,
      });
      setAiSuggestions([data.rewritten]);
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!to || !subject || !body) return;
    try {
      setLoading(true);
      await api.post('/gmail/send', { to, subject, body });
      router.push('/inbox');
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-slate-900">Compose Email</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-slate-600" />
              New Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label htmlFor="to" className="text-slate-700 font-medium text-sm">To</Label>
              <Input 
                id="to" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                placeholder="recipient@example.com"
                className="mt-1 border-slate-300"
              />
            </div>
            <div>
              <Label htmlFor="subject" className="text-slate-700 font-medium text-sm">Subject</Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Email subject"
                className="mt-1 border-slate-300"
              />
            </div>
            <div>
              <Label htmlFor="body" className="text-slate-700 font-medium text-sm">Message</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full min-h-[250px] rounded-md border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent mt-1"
                placeholder="Write your message..."
              />
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="assertive">Assertive</option>
                <option value="short">Short</option>
              </select>
              <Button 
                onClick={generateAISuggestion} 
                variant="outline" 
                disabled={loading || !body}
                className="flex-1 border-slate-300"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'AI Enhance'}
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold mb-2 text-slate-900">✨ AI Suggestion:</p>
                <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{aiSuggestions[0]}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBody(aiSuggestions[0]);
                    setAiSuggestions([]);
                  }}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Use This Suggestion
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => router.push('/inbox')} className="border-slate-300">
                Cancel
              </Button>
              <Button 
                onClick={sendEmail} 
                disabled={loading || !to || !subject || !body}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
