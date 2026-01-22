'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import AppShell from '@/components/layout/AppShell';
import EmailSidebar from '@/components/inbox/EmailSidebar';
import EmailList from '@/components/inbox/EmailList';
import EmailViewer from '@/components/inbox/EmailViewer';
import { Email, EmailTab } from '@/components/inbox/types';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Search } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ type: string; content: string } | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EmailTab>('inbox');
  
  // Toast and Modal states
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // For undo functionality
  const pendingActionRef = useRef<{ type: 'trash' | 'archive'; email: Email; timeout: NodeJS.Timeout } | null>(null);
  const pendingReplyRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [activeTab]);

  // Cleanup pending actions on unmount
  useEffect(() => {
    return () => {
      if (pendingActionRef.current) {
        clearTimeout(pendingActionRef.current.timeout);
      }
      if (pendingReplyRef.current) {
        clearTimeout(pendingReplyRef.current);
      }
    };
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const label = activeTab === 'inbox' ? 'INBOX' : activeTab === 'sent' ? 'SENT' : 'STARRED';
      const { data } = await api.get(`/gmail/messages?maxResults=50&label=${label}`);
      setEmails(data.emails || []);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      setError(null);
      await fetchEmails();
      setToast({ message: 'Emails synced successfully', type: 'success' });
    } catch (err: any) {
      setError('Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const selectEmail = async (email: Email) => {
    try {
      setSelectedEmail(email);
      setShowReply(false);
      setAiResult(null);
      setReplyBody('');

      if (!email.body && !email.htmlBody) {
        const { data } = await api.get(`/gmail/message/${email.gmailId}/full`);
        const fullEmail = { 
          ...email, 
          body: data.email.body,
          htmlBody: data.email.htmlBody 
        };
        setSelectedEmail(fullEmail);
        setEmails((prev) =>
          prev.map((e) => (e.gmailId === email.gmailId ? fullEmail : e))
        );
      }

      if (!email.isRead) {
        await api.post(`/gmail/message/${email.gmailId}/read`);
        setEmails((prev) =>
          prev.map((e) =>
            e.gmailId === email.gmailId ? { ...e, isRead: true } : e
          )
        );
      }
    } catch (err) {
      console.error('Error selecting email:', err);
    }
  };

  const toggleStar = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const endpoint = email.isStarred ? 'unstar' : 'star';
      await api.post(`/gmail/message/${email.gmailId}/${endpoint}`);

      setEmails((prev) =>
        prev.map((e) =>
          e.gmailId === email.gmailId ? { ...e, isStarred: !e.isStarred } : e
        )
      );

      if (selectedEmail?.gmailId === email.gmailId) {
        setSelectedEmail((prev) =>
          prev ? { ...prev, isStarred: !prev.isStarred } : null
        );
      }
      
      setToast({ 
        message: email.isStarred ? 'Removed from starred' : 'Added to starred', 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error toggling star:', err);
      setToast({ message: 'Failed to update star', type: 'error' });
    }
  };

  const trashEmail = async (email: Email) => {
    // Cancel any pending action
    if (pendingActionRef.current) {
      clearTimeout(pendingActionRef.current.timeout);
      pendingActionRef.current = null;
    }

    // Optimistically remove from UI
    const removedEmail = email;
    setEmails((prev) => prev.filter((e) => e.gmailId !== email.gmailId));
    if (selectedEmail?.gmailId === email.gmailId) {
      setSelectedEmail(null);
    }

    // Set up delayed action with undo option
    const timeout = setTimeout(async () => {
      try {
        await api.post(`/gmail/message/${email.gmailId}/trash`);
        pendingActionRef.current = null;
      } catch (err) {
        console.error('Error trashing email:', err);
        // Restore email on error
        setEmails((prev) => [removedEmail, ...prev]);
        setToast({ message: 'Failed to move to trash', type: 'error' });
      }
    }, 4000);

    pendingActionRef.current = { type: 'trash', email: removedEmail, timeout };

    setToast({
      message: 'Email moved to trash',
      type: 'success',
      action: {
        label: 'Undo',
        onClick: () => {
          if (pendingActionRef.current) {
            clearTimeout(pendingActionRef.current.timeout);
            pendingActionRef.current = null;
          }
          setEmails((prev) => [removedEmail, ...prev]);
        },
      },
    });
  };

  const archiveEmail = async (email: Email) => {
    // Cancel any pending action
    if (pendingActionRef.current) {
      clearTimeout(pendingActionRef.current.timeout);
      pendingActionRef.current = null;
    }

    // Optimistically remove from UI
    const removedEmail = email;
    setEmails((prev) => prev.filter((e) => e.gmailId !== email.gmailId));
    if (selectedEmail?.gmailId === email.gmailId) {
      setSelectedEmail(null);
    }

    // Set up delayed action with undo option
    const timeout = setTimeout(async () => {
      try {
        await api.post(`/gmail/message/${email.gmailId}/archive`);
        pendingActionRef.current = null;
      } catch (err) {
        console.error('Error archiving email:', err);
        // Restore email on error
        setEmails((prev) => [removedEmail, ...prev]);
        setToast({ message: 'Failed to archive', type: 'error' });
      }
    }, 4000);

    pendingActionRef.current = { type: 'archive', email: removedEmail, timeout };

    setToast({
      message: 'Email archived',
      type: 'success',
      action: {
        label: 'Undo',
        onClick: () => {
          if (pendingActionRef.current) {
            clearTimeout(pendingActionRef.current.timeout);
            pendingActionRef.current = null;
          }
          setEmails((prev) => [removedEmail, ...prev]);
        },
      },
    });
  };

  const handleSendReplyClick = () => {
    if (!selectedEmail || !replyBody.trim()) return;
    setShowSendModal(true);
  };

  const cancelPendingReply = () => {
    if (pendingReplyRef.current) {
      clearTimeout(pendingReplyRef.current);
      pendingReplyRef.current = null;
      setSendingReply(false);
      setToast({ message: 'Reply cancelled', type: 'success' });
    }
  };

  const sendReply = async () => {
    if (!selectedEmail || !replyBody.trim()) return;

    setShowSendModal(false);
    setSendingReply(true);
    
    // Get signature from localStorage
    const signature = localStorage.getItem('emailSignature') || '';
    const bodyWithSignature = signature 
      ? `${replyBody.trim()}\n\n${signature}`
      : replyBody.trim();

    const emailId = selectedEmail.gmailId;

    // Show toast with undo option
    setToast({
      message: 'Sending reply...',
      type: 'success',
      action: {
        label: 'Undo',
        onClick: cancelPendingReply,
      },
    });

    // Delay the actual send to allow undo
    pendingReplyRef.current = setTimeout(async () => {
      try {
        await api.post(`/gmail/message/${emailId}/reply`, {
          body: bodyWithSignature,
        });

        pendingReplyRef.current = null;
        setShowReply(false);
        setReplyBody('');
        setAiResult(null);
        setToast({ message: 'Reply sent successfully!', type: 'success' });
      } catch (err: any) {
        console.error('Error sending reply:', err);
        setToast({ message: err?.response?.data?.message || 'Failed to send reply', type: 'error' });
      } finally {
        setSendingReply(false);
      }
    }, 4000);
  };

  const generateAISummary = async () => {
    if (!selectedEmail?.body) return;

    try {
      setAiLoading('summary');
      const { data } = await api.post('/ai/summarize', {
        emailBody: selectedEmail.body,
        gmailId: selectedEmail.gmailId,
        threadId: selectedEmail.threadId,
        subject: selectedEmail.subject,
        from: selectedEmail.from,
      });
      setAiResult({ type: 'summary', content: data.summary });
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setAiResult({
        type: 'error',
        content: err?.response?.data?.message || 'Failed to generate summary',
      });
    } finally {
      setAiLoading(null);
    }
  };

  const generateAIReply = async (tone: string = 'friendly') => {
    if (!selectedEmail?.body) return;

    try {
      setAiLoading('reply');
      const { data } = await api.post('/ai/reply', {
        emailBody: selectedEmail.body,
        gmailId: selectedEmail.gmailId,
        threadId: selectedEmail.threadId,
        subject: selectedEmail.subject,
        from: selectedEmail.from,
        tone,
      });
      const reply = Array.isArray(data.replies)
        ? data.replies[0]
        : data.reply || data.replies;
      setAiResult({ type: 'reply', content: reply });
      setReplyBody(reply);
      setShowReply(true);
    } catch (err: any) {
      console.error('Error generating reply:', err);
      setAiResult({
        type: 'error',
        content: err?.response?.data?.message || 'Failed to generate reply',
      });
    } finally {
      setAiLoading(null);
    }
  };

  const generateFollowUp = async () => {
    if (!selectedEmail?.body) return;

    try {
      setAiLoading('followup');
      const { data } = await api.post('/ai/followup', {
        emailBody: selectedEmail.body,
        gmailId: selectedEmail.gmailId,
        threadId: selectedEmail.threadId,
        subject: selectedEmail.subject,
        from: selectedEmail.from,
      });
      setAiResult({ type: 'followup', content: data.followUp });
      setReplyBody(data.followUp);
      setShowReply(true);
    } catch (err: any) {
      console.error('Error generating follow-up:', err);
      setAiResult({
        type: 'error',
        content: err?.response?.data?.message || 'Failed to generate follow-up',
      });
    } finally {
      setAiLoading(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearAiResult = () => {
    setAiResult(null);
  };

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(query) ||
      email.from?.toLowerCase().includes(query) ||
      email.snippet?.toLowerCase().includes(query)
    );
  });

  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <AppShell>
      <div className="h-[calc(100vh-56px)] flex">
        {/* Sidebar */}
        <EmailSidebar
          activeTab={activeTab}
          unreadCount={unreadCount}
          syncing={syncing}
          onTabChange={setActiveTab}
          onSync={syncEmails}
        />

        {/* Email List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border-gray-200 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* List Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 text-sm capitalize">{activeTab}</h2>
            <p className="text-xs text-gray-400">{filteredEmails.length} emails</p>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            <EmailList
              emails={filteredEmails}
              selectedEmail={selectedEmail}
              loading={loading}
              error={error}
              activeTab={activeTab}
              onSelectEmail={selectEmail}
              onToggleStar={toggleStar}
              onArchive={archiveEmail}
              onTrash={trashEmail}
              onRetry={fetchEmails}
            />
          </div>
        </div>

        {/* Email Viewer */}
        <EmailViewer
          email={selectedEmail}
          showReply={showReply}
          replyBody={replyBody}
          sendingReply={sendingReply}
          aiLoading={aiLoading}
          aiResult={aiResult}
          onArchive={archiveEmail}
          onTrash={trashEmail}
          onSetShowReply={setShowReply}
          onSetReplyBody={setReplyBody}
          onSendReply={handleSendReplyClick}
          onGenerateSummary={generateAISummary}
          onGenerateReply={generateAIReply}
          onGenerateFollowUp={generateFollowUp}
          onCopyToClipboard={copyToClipboard}
          onClearAiResult={clearAiResult}
          copiedToClipboard={copiedToClipboard}
        />
      </div>

      {/* Send Reply Confirmation Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Reply"
        description="Are you sure you want to send this reply?"
        confirmText={sendingReply ? 'Sending...' : 'Send Reply'}
        cancelText="Cancel"
        onConfirm={sendReply}
        loading={sendingReply}
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
