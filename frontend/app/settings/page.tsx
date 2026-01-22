'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Save, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/axios';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [defaultTone, setDefaultTone] = useState<'formal' | 'friendly' | 'assertive' | 'short'>('friendly');
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    const savedTone = localStorage.getItem('defaultTone');
    const savedSignature = localStorage.getItem('emailSignature');
    
    if (savedTone) {
      setDefaultTone(savedTone as any);
    }
    if (savedSignature) {
      setSignature(savedSignature);
    }
  }, []);

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage
      localStorage.setItem('defaultTone', defaultTone);
      localStorage.setItem('emailSignature', signature);
      
      // Try to save to backend if available
      try {
        await api.post('/analytics/preferences', {
          defaultTone,
          signature,
        });
      } catch (e) {
        // Backend save failed, but local save succeeded
        console.log('Backend save not available, saved locally');
      }
      
      setShowSaveModal(false);
      setToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

        <div className="space-y-6">
          {/* AI Preferences */}
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                AI Preferences
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Configure AI behavior for email generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="defaultTone" className="text-gray-700 font-medium text-sm">
                  Default Tone
                </Label>
                <select
                  id="defaultTone"
                  value={defaultTone}
                  onChange={(e) => setDefaultTone(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 mt-1.5"
                >
                  <option value="formal">Formal - Professional</option>
                  <option value="friendly">Friendly - Warm</option>
                  <option value="assertive">Assertive - Direct</option>
                  <option value="short">Short - Concise</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  This tone will be used by default when generating AI replies
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Signature */}
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Mail className="h-4 w-4 text-gray-600" />
                Email Signature
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Automatically appended to all outgoing emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full min-h-[100px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="Best regards,&#10;Your Name&#10;your@email.com"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                This signature will be added at the end of every email you send
              </p>
            </CardContent>
          </Card>

          {/* Connected Account */}
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Connected Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Gmail Connected</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push('/inbox')}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Open Inbox
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/compose')}
                  className="border-gray-200"
                >
                  Compose
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Settings"
        description="Are you sure you want to save these settings? Your preferences will be applied immediately."
        confirmText={saving ? 'Saving...' : 'Save'}
        cancelText="Cancel"
        onConfirm={savePreferences}
        loading={saving}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppShell>
  );
}
