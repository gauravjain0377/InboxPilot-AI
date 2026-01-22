'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import AppShell from '@/components/layout/AppShell';
import ComposeForm from '@/components/compose/ComposeForm';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Send, Wand2, Loader2 } from 'lucide-react';

type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [sending, setSending] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone>('friendly');

  // Toast and Modal states
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // For undo send functionality
  const pendingSendRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load default tone from settings
    const savedTone = localStorage.getItem('defaultTone');
    if (savedTone) {
      setSelectedTone(savedTone as Tone);
    }

    const replyTo = searchParams.get('replyTo');
    const replySubject = searchParams.get('subject');

    if (replyTo) setTo(replyTo);
    if (replySubject)
      setSubject(
        replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`
      );
  }, [user, router, searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingSendRef.current) {
        clearTimeout(pendingSendRef.current);
      }
    };
  }, []);

  const enhanceWithAI = async () => {
    if (!body.trim()) {
      setToast({ message: 'Please write some content first', type: 'error' });
      return;
    }

    try {
      setEnhancing(true);

      const { data } = await api.post('/ai/rewrite', {
        text: body,
        instruction: `Enhance and improve this email to be more ${selectedTone}. Make it clear, professional, and well-structured. Keep the same meaning but improve the writing.`,
      });

      setAiSuggestion(data.rewritten);
    } catch (err: any) {
      console.error('Error enhancing email:', err);
      setToast({ message: err?.response?.data?.message || 'Failed to enhance email', type: 'error' });
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

  const handleSendClick = () => {
    if (!to.trim()) {
      setToast({ message: 'Please enter a recipient', type: 'error' });
      return;
    }
    if (!subject.trim()) {
      setToast({ message: 'Please enter a subject', type: 'error' });
      return;
    }
    if (!body.trim()) {
      setToast({ message: 'Please write your message', type: 'error' });
      return;
    }
    setShowSendModal(true);
  };

  const cancelPendingSend = () => {
    if (pendingSendRef.current) {
      clearTimeout(pendingSendRef.current);
      pendingSendRef.current = null;
      setSending(false);
      setToast({ message: 'Send cancelled', type: 'success' });
    }
  };

  const sendEmail = async () => {
    setShowSendModal(false);
    setSending(true);

    // Get signature from localStorage
    const signature = localStorage.getItem('emailSignature') || '';
    const bodyWithSignature = signature 
      ? `${body.trim()}\n\n${signature}`
      : body.trim();

    // Build recipients
    const recipients: string[] = to.split(',').map(e => e.trim()).filter(Boolean);
    const ccRecipients: string[] = cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : [];
    const bccRecipients: string[] = bcc ? bcc.split(',').map(e => e.trim()).filter(Boolean) : [];

    // Show toast with undo option
    setToast({
      message: 'Sending email...',
      type: 'success',
      action: {
        label: 'Undo',
        onClick: cancelPendingSend,
      },
    });

    // Delay the actual send to allow undo
    pendingSendRef.current = setTimeout(async () => {
      try {
        await api.post('/gmail/send', {
          to: recipients.join(', '),
          cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
          bcc: bccRecipients.length > 0 ? bccRecipients.join(', ') : undefined,
          subject: subject.trim(),
          body: bodyWithSignature,
        });

        pendingSendRef.current = null;
        setToast({ message: 'Email sent successfully!', type: 'success' });

        setTimeout(() => {
          router.push('/inbox');
        }, 1000);
      } catch (err: any) {
        console.error('Error sending email:', err);
        setToast({ message: err?.response?.data?.message || 'Failed to send email', type: 'error' });
      } finally {
        setSending(false);
      }
    }, 4000);
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold text-gray-900">New Message</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={enhanceWithAI}
              disabled={enhancing || !body.trim()}
              className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex-1 sm:flex-none"
            >
              {enhancing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">AI Enhance</span>
              <span className="sm:hidden">Enhance</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSendClick}
              disabled={sending}
              className="bg-gray-900 hover:bg-gray-800 text-white min-w-[80px] sm:min-w-[90px] flex-1 sm:flex-none"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>

        {/* Compose Form */}
        <ComposeForm
          to={to}
          cc={cc}
          bcc={bcc}
          subject={subject}
          body={body}
          showCc={showCc}
          showBcc={showBcc}
          selectedTone={selectedTone}
          aiSuggestion={aiSuggestion}
          onToChange={setTo}
          onCcChange={setCc}
          onBccChange={setBcc}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onShowCcChange={setShowCc}
          onShowBccChange={setShowBcc}
          onToneChange={setSelectedTone}
          onUseSuggestion={useSuggestion}
          onDismissSuggestion={() => setAiSuggestion(null)}
        />
      </div>

      {/* Send Confirmation Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Email"
        description={`Send this email to ${to}${cc ? `, Cc: ${cc}` : ''}${bcc ? `, Bcc: ${bcc}` : ''}?`}
        confirmText="Send Email"
        cancelText="Cancel"
        onConfirm={sendEmail}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
    </AppShell>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  );
}
