'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Star,
  Trash2,
  Archive,
  RefreshCw,
  Search,
  ChevronLeft,
  Send,
  Reply,
  Sparkles,
  Clock,
  MailOpen,
  Inbox,
  ArrowLeft,
  MoreHorizontal,
  Wand2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Email {
  _id: string;
  gmailId: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body?: string;
  snippet?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  labels?: string[];
}

export default function InboxPage() {
  const router = useRouter();
  const { user } = useUserStore();
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
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'starred'>('inbox');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchEmails();
  }, [user, router, activeTab]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const label = activeTab === 'inbox' ? 'INBOX' : activeTab === 'sent' ? 'SENT' : 'STARRED';
      const { data } = await api.get(`/gmail/messages?maxResults=50&label=${label}`);
      setEmails(data.emails || []);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err?.response?.data?.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      setError(null);
      await fetchEmails();
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

      // Fetch full email content if body is missing
      if (!email.body) {
        const { data } = await api.get(`/gmail/message/${email.gmailId}/full`);
        const fullEmail = { ...email, body: data.email.body };
        setSelectedEmail(fullEmail);
        
        // Update in list
        setEmails(prev => prev.map(e => e.gmailId === email.gmailId ? fullEmail : e));
      }

      // Mark as read
      if (!email.isRead) {
        await api.post(`/gmail/message/${email.gmailId}/read`);
        setEmails(prev => prev.map(e => 
          e.gmailId === email.gmailId ? { ...e, isRead: true } : e
        ));
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
      
      setEmails(prev => prev.map(e => 
        e.gmailId === email.gmailId ? { ...e, isStarred: !e.isStarred } : e
      ));
      
      if (selectedEmail?.gmailId === email.gmailId) {
        setSelectedEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const trashEmail = async (email: Email) => {
    try {
      await api.post(`/gmail/message/${email.gmailId}/trash`);
      setEmails(prev => prev.filter(e => e.gmailId !== email.gmailId));
      if (selectedEmail?.gmailId === email.gmailId) {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Error trashing email:', err);
    }
  };

  const archiveEmail = async (email: Email) => {
    try {
      await api.post(`/gmail/message/${email.gmailId}/archive`);
      setEmails(prev => prev.filter(e => e.gmailId !== email.gmailId));
      if (selectedEmail?.gmailId === email.gmailId) {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Error archiving email:', err);
    }
  };

  const sendReply = async () => {
    if (!selectedEmail || !replyBody.trim()) return;
    
    try {
      setSendingReply(true);
      await api.post(`/gmail/message/${selectedEmail.gmailId}/reply`, {
        body: replyBody,
      });
      
      setShowReply(false);
      setReplyBody('');
      setAiResult(null);
      
      // Show success feedback
      alert('Reply sent successfully!');
    } catch (err: any) {
      console.error('Error sending reply:', err);
      alert(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const generateAISummary = async () => {
    if (!selectedEmail?.body) return;
    
    try {
      setAiLoading('summary');
      const { data } = await api.post('/ai/summarize', {
        emailBody: selectedEmail.body,
      });
      setAiResult({ type: 'summary', content: data.summary });
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setAiResult({ type: 'error', content: err?.response?.data?.message || 'Failed to generate summary' });
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
        tone,
      });
      const reply = Array.isArray(data.replies) ? data.replies[0] : data.reply || data.replies;
      setAiResult({ type: 'reply', content: reply });
      setReplyBody(reply);
      setShowReply(true);
    } catch (err: any) {
      console.error('Error generating reply:', err);
      setAiResult({ type: 'error', content: err?.response?.data?.message || 'Failed to generate reply' });
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
      });
      setAiResult({ type: 'followup', content: data.followUp });
      setReplyBody(data.followUp);
      setShowReply(true);
    } catch (err: any) {
      console.error('Error generating follow-up:', err);
      setAiResult({ type: 'error', content: err?.response?.data?.message || 'Failed to generate follow-up' });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatSenderName = (from: string) => {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim().replace(/"/g, '') : from;
  };

  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(query) ||
      email.from?.toLowerCase().includes(query) ||
      email.snippet?.toLowerCase().includes(query)
    );
  });

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">InboxPilot</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-gray-50 border-gray-200"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={syncEmails}
            disabled={syncing}
            className="border-gray-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/compose')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 p-3 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Inbox className="h-4 w-4" />
              Inbox
              {emails.filter(e => !e.isRead && activeTab === 'inbox').length > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {emails.filter(e => !e.isRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('starred')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'starred'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Star className="h-4 w-4" />
              Starred
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Send className="h-4 w-4" />
              Sent
            </button>
          </nav>
        </aside>

        {/* Email List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 capitalize">{activeTab}</h2>
            <p className="text-xs text-gray-500">{filteredEmails.length} emails</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchEmails} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MailOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No emails found</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.gmailId}
                  onClick={() => selectEmail(email)}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedEmail?.gmailId === email.gmailId
                      ? 'bg-blue-50 border-l-2 border-l-blue-600'
                      : 'hover:bg-gray-50'
                  } ${!email.isRead ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => toggleStar(email, e)}
                      className="mt-0.5 shrink-0"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          email.isStarred
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {formatSenderName(email.from)}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${!email.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {email.subject || '(No subject)'}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {email.snippet}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-4 border-b border-gray-200 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {selectedEmail.subject || '(No subject)'}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">{formatSenderName(selectedEmail.from)}</span>
                      <span className="text-gray-400">•</span>
                      <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      To: {selectedEmail.to?.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveEmail(selectedEmail)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => trashEmail(selectedEmail)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI Actions Bar */}
              <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-purple-700 mr-2">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    AI Actions:
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateAISummary}
                    disabled={aiLoading !== null}
                    className="text-xs h-7 border-purple-200 hover:bg-purple-100"
                  >
                    {aiLoading === 'summary' ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3 mr-1" />
                    )}
                    Summarize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateAIReply('friendly')}
                    disabled={aiLoading !== null}
                    className="text-xs h-7 border-blue-200 hover:bg-blue-100"
                  >
                    {aiLoading === 'reply' ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Reply className="h-3 w-3 mr-1" />
                    )}
                    Generate Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateFollowUp}
                    disabled={aiLoading !== null}
                    className="text-xs h-7 border-green-200 hover:bg-green-100"
                  >
                    {aiLoading === 'followup' ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    Follow-up
                  </Button>
                </div>
              </div>

              {/* AI Result */}
              {aiResult && (
                <div className={`p-3 border-b shrink-0 ${
                  aiResult.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium mb-1 ${
                        aiResult.type === 'error' ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {aiResult.type === 'summary' && 'AI Summary'}
                        {aiResult.type === 'reply' && 'AI Generated Reply'}
                        {aiResult.type === 'followup' && 'AI Follow-up'}
                        {aiResult.type === 'error' && 'Error'}
                      </p>
                      <p className={`text-sm whitespace-pre-wrap ${
                        aiResult.type === 'error' ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {aiResult.content}
                      </p>
                    </div>
                    {aiResult.type !== 'error' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(aiResult.content)}
                        className="shrink-0 ml-2"
                      >
                        {copiedToClipboard ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                    {selectedEmail.body || selectedEmail.snippet || 'Loading email content...'}
                  </pre>
                </div>
              </div>

              {/* Reply Section */}
              <div className="border-t border-gray-200 p-4 shrink-0 bg-gray-50">
                {showReply ? (
                  <div className="space-y-3">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateAIReply('formal')}
                          disabled={aiLoading !== null}
                          className="text-xs"
                        >
                          Formal
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateAIReply('friendly')}
                          disabled={aiLoading !== null}
                          className="text-xs"
                        >
                          Friendly
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateAIReply('short')}
                          disabled={aiLoading !== null}
                          className="text-xs"
                        >
                          Short
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowReply(false);
                            setReplyBody('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={sendReply}
                          disabled={sendingReply || !replyBody.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {sendingReply ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowReply(true)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply to this email
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select an email to read</p>
                <p className="text-sm mt-1">Choose an email from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
