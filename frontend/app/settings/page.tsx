'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [defaultTone, setDefaultTone] = useState<'formal' | 'friendly' | 'assertive' | 'short'>('friendly');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Settings</h1>
          <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                AI Provider: <strong>Gemini</strong> (Only Gemini is supported)
              </p>
            </div>
            <div>
              <Label htmlFor="defaultTone">Default Tone</Label>
              <select
                id="defaultTone"
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value as any)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="assertive">Assertive</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <Label htmlFor="signature">Email Signature</Label>
              <textarea
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Your email signature..."
              />
            </div>
            <Button>Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

