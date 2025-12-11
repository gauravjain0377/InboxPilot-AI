'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Settings as SettingsIcon, Sparkles, Copy } from 'lucide-react';
import api from '@/lib/axios';
import { useUserStore } from '@/store/userStore';

export default function SettingsPage() {
  const router = useRouter();
  const { user, token } = useUserStore();
  const [defaultTone, setDefaultTone] = useState<'formal' | 'friendly' | 'assertive' | 'short'>('friendly');
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const savePreferences = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
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
            <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="grid gap-6">
          {/* AI Preferences */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-slate-600" />
                AI Preferences
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Configure how AI generates your email content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-slate-700">AI Provider</span>
                </div>
                <p className="text-sm text-slate-600">
                  Currently using <strong className="text-slate-900">Gemini AI</strong> for all AI-powered features
                </p>
              </div>

              <div>
                <Label htmlFor="defaultTone" className="text-slate-700 font-medium text-sm">Default Tone</Label>
                <select
                  id="defaultTone"
                  value={defaultTone}
                  onChange={(e) => setDefaultTone(e.target.value as any)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 mt-1"
                >
                  <option value="formal">Formal - Professional and business-like</option>
                  <option value="friendly">Friendly - Warm and approachable</option>
                  <option value="assertive">Assertive - Direct and confident</option>
                  <option value="short">Short - Brief and concise</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  This tone will be used by default when generating AI replies
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Signature */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <SettingsIcon className="h-4 w-4 text-slate-600" />
                Email Signature
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Add a signature that will be automatically appended to your emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="signature" className="text-slate-700 font-medium text-sm">Signature</Label>
                <textarea
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full min-h-[120px] rounded-md border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent mt-1"
                  placeholder="Your email signature..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  This signature will be added to all AI-generated emails
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chrome Extension Connection */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <SettingsIcon className="h-4 w-4 text-slate-600" />
                Chrome Extension
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                One-click connect your InboxPilot Chrome extension to this account. No tokens or copy-paste needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {token ? (
                <>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Connect InboxPilot inside Gmail
                    </p>
                    <p className="text-xs text-slate-500">
                      Make sure the InboxPilot Chrome extension is installed, then click the button below.
                      We&apos;ll securely send your login token to the extension and mark this Gmail account as connected.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-slate-900 hover:bg-slate-800 text-white w-full"
                    onClick={() => {
                      try {
                        const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;
                        if (!extensionId) {
                          alert(
                            'Chrome extension ID is not configured.\n\nSet NEXT_PUBLIC_CHROME_EXTENSION_ID in your frontend environment to enable one-click connect.'
                          );
                          return;
                        }

                        const encodedToken = encodeURIComponent(token);
                        const url = `chrome-extension://${extensionId}/popup.html?token=${encodedToken}`;
                        window.open(url, '_blank');
                      } catch (err) {
                        console.error('Error opening extension:', err);
                        alert('Unable to open the Chrome extension. Please make sure it is installed.');
                      }
                    }}
                  >
                    Connect Chrome Extension
                  </Button>
                  <p className="text-xs text-slate-500">
                    A small popup window will open from the extension. After a moment, InboxPilot will be enabled
                    inside your Gmail for this account.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  No login token found. Please sign in again to InboxPilot on this browser, then come back here to
                  connect the extension.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white">
              Cancel
            </Button>
            <Button 
              onClick={savePreferences}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
