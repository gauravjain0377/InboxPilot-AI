'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Compose</h1>
          <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>New Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Write your message..."
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="assertive">Assertive</option>
                <option value="short">Short</option>
              </select>
              <Button onClick={generateAISuggestion} variant="outline" disabled={loading || !body}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Enhance
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">AI Suggestion:</p>
                <p className="text-sm">{aiSuggestions[0]}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setBody(aiSuggestions[0]);
                    setAiSuggestions([]);
                  }}
                >
                  Use This
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push('/inbox')}>
                Cancel
              </Button>
              <Button onClick={sendEmail} disabled={loading || !to || !subject || !body}>
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

