'use client';

import { Mail, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Email } from './types';
import AIActionsBar from './AIActionsBar';
import ReplyBox from './ReplyBox';

interface EmailViewerProps {
  email: Email | null;
  showReply: boolean;
  replyBody: string;
  sendingReply: boolean;
  aiLoading: string | null;
  aiResult: { type: string; content: string } | null;
  onArchive: (email: Email) => void;
  onTrash: (email: Email) => void;
  onSetShowReply: (show: boolean) => void;
  onSetReplyBody: (body: string) => void;
  onSendReply: () => void;
  onGenerateSummary: () => void;
  onGenerateReply: (tone: string) => void;
  onGenerateFollowUp: () => void;
  onCopyToClipboard: (text: string) => void;
  onClearAiResult: () => void;
  copiedToClipboard: boolean;
}

// Function to strip HTML and extract plain text
function stripHtml(html: string): string {
  // Create a temporary element to parse HTML
  if (typeof window === 'undefined') {
    // Server-side: basic regex stripping
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Client-side: use DOM parser
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Function to check if content is HTML
function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

// Function to format email body for display
function formatEmailBody(body: string | undefined): string {
  if (!body) return '';
  
  // If it looks like HTML, strip it
  if (isHtml(body)) {
    return stripHtml(body);
  }
  
  return body;
}

export default function EmailViewer({
  email,
  showReply,
  replyBody,
  sendingReply,
  aiLoading,
  aiResult,
  onArchive,
  onTrash,
  onSetShowReply,
  onSetReplyBody,
  onSendReply,
  onGenerateSummary,
  onGenerateReply,
  onGenerateFollowUp,
  onCopyToClipboard,
  onClearAiResult,
  copiedToClipboard,
}: EmailViewerProps) {
  const formatSenderName = (from: string) => {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim().replace(/"/g, '') : from;
  };

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/50">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-base font-medium text-gray-500">Select an email</p>
          <p className="text-sm text-gray-400 mt-1">Choose from the list to view</p>
        </div>
      </div>
    );
  }

  const displayBody = formatEmailBody(email.body || email.snippet);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Email Header */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {email.subject || '(No subject)'}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">{formatSenderName(email.from)}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">{new Date(email.date).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              To: {email.to?.join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(email)}
              className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTrash(email)}
              className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Actions */}
      <AIActionsBar
        aiLoading={aiLoading}
        aiResult={aiResult}
        onGenerateSummary={onGenerateSummary}
        onGenerateReply={onGenerateReply}
        onGenerateFollowUp={onGenerateFollowUp}
        onCopyToClipboard={onCopyToClipboard}
        onClearAiResult={onClearAiResult}
        copiedToClipboard={copiedToClipboard}
      />

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayBody || 'Loading email content...'}
          </p>
        </div>
      </div>

      {/* Reply Section */}
      <ReplyBox
        showReply={showReply}
        replyBody={replyBody}
        sendingReply={sendingReply}
        aiLoading={aiLoading}
        onSetShowReply={onSetShowReply}
        onSetReplyBody={onSetReplyBody}
        onSendReply={onSendReply}
        onGenerateReply={onGenerateReply}
      />
    </div>
  );
}
