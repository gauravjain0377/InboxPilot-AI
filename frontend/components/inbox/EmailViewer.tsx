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

// Function to check if content is HTML
function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

// Function to sanitize HTML for safe rendering
function sanitizeHtml(html: string): string {
  // Remove potentially dangerous elements but keep formatting
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
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

  const getInitials = (from: string) => {
    const name = formatSenderName(from);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

  // Prefer htmlBody for rich formatting, fall back to body or snippet
  const htmlContent = email.htmlBody || '';
  const textContent = email.body || email.snippet || '';
  const hasHtmlContent = htmlContent && isHtml(htmlContent);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Email Header */}
      <div className="p-5 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {email.subject || '(No subject)'}
            </h2>
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {getInitials(email.from)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{formatSenderName(email.from)}</span>
                  <span className="text-sm text-gray-500">
                    &lt;{email.from.match(/<([^>]+)>/)?.[1] || email.from}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                  <span>{new Date(email.date).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  to {email.to?.join(', ') || 'me'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Archive Button with Tooltip */}
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onArchive(email)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-9 w-9 p-0"
              >
                <Archive className="h-5 w-5" />
              </Button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Archive
              </span>
            </div>
            {/* Delete Button with Tooltip */}
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTrash(email)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 p-0"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Delete
              </span>
            </div>
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
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {hasHtmlContent ? (
            <div 
              className="email-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#333',
              }}
            />
          ) : (
            <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
              {textContent || 'Loading email content...'}
            </pre>
          )}
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

      {/* Email Content Styles - Gmail-like appearance */}
      <style jsx global>{`
        .email-content {
          word-break: break-word;
          font-family: 'Google Sans', Roboto, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #202124;
        }
        .email-content img {
          max-width: 100%;
          height: auto;
          display: inline-block;
        }
        .email-content a {
          color: #1a73e8;
          text-decoration: none;
        }
        .email-content a:hover {
          text-decoration: underline;
        }
        .email-content table {
          border-collapse: collapse;
          max-width: 100%;
        }
        .email-content td, .email-content th {
          vertical-align: top;
        }
        .email-content blockquote {
          border-left: 3px solid #dadce0;
          margin: 16px 0;
          padding-left: 12px;
          color: #5f6368;
        }
        .email-content p {
          margin: 0 0 12px 0;
        }
        .email-content h1, .email-content h2, .email-content h3 {
          margin: 20px 0 12px 0;
          font-weight: 500;
          color: #202124;
        }
        .email-content h1 { font-size: 24px; }
        .email-content h2 { font-size: 20px; }
        .email-content h3 { font-size: 16px; }
        .email-content ul, .email-content ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        .email-content li {
          margin: 6px 0;
        }
        .email-content hr {
          border: none;
          border-top: 1px solid #dadce0;
          margin: 20px 0;
        }
        .email-content pre {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 13px;
          font-family: 'Google Sans Mono', monospace;
        }
        .email-content code {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Google Sans Mono', monospace;
        }
        /* Gmail-specific styles */
        .email-content div[style*="border-left"] {
          border-left-color: #dadce0 !important;
        }
        .email-content .gmail_quote {
          color: #5f6368;
          border-left: 1px solid #dadce0;
          margin-left: 0;
          padding-left: 12px;
        }
        /* Center alignment for email headers/logos */
        .email-content center,
        .email-content [align="center"] {
          text-align: center;
        }
        /* Responsive images */
        .email-content img[width] {
          width: auto;
          max-width: 100%;
        }
        /* Button styles often found in marketing emails */
        .email-content a[style*="background"] {
          display: inline-block;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
