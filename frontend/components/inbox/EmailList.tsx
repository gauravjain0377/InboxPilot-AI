'use client';

import { useState } from 'react';
import { Star, MailOpen, Loader2, AlertCircle, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Email, EmailTab } from './types';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  loading: boolean;
  error: string | null;
  activeTab: EmailTab;
  onSelectEmail: (email: Email) => void;
  onToggleStar: (email: Email, e: React.MouseEvent) => void;
  onArchive?: (email: Email) => void;
  onTrash?: (email: Email) => void;
  onRetry: () => void;
}

export default function EmailList({
  emails,
  selectedEmail,
  loading,
  error,
  activeTab,
  onSelectEmail,
  onToggleStar,
  onArchive,
  onTrash,
  onRetry,
}: EmailListProps) {
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);

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

  const handleArchiveClick = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    if (onArchive) onArchive(email);
  };

  const handleTrashClick = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    if (onTrash) onTrash(email);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-3">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry} className="text-xs">
          Try Again
        </Button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <MailOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No emails</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {emails.map((email) => {
        const showActions = hoveredEmail === email.gmailId;

        return (
          <div
            key={email.gmailId}
            onClick={() => onSelectEmail(email)}
            onMouseEnter={() => setHoveredEmail(email.gmailId)}
            onMouseLeave={() => setHoveredEmail(null)}
            className={`px-3 py-2.5 cursor-pointer transition-colors ${
              selectedEmail?.gmailId === email.gmailId
                ? 'bg-gray-100'
                : 'hover:bg-gray-50'
            } ${!email.isRead ? 'bg-white' : ''}`}
          >
            <div className="flex items-start gap-2.5">
              <button
                onClick={(e) => onToggleStar(email, e)}
                className="mt-0.5 shrink-0"
              >
                <Star
                  className={`h-4 w-4 ${
                    email.isStarred
                      ? 'fill-gray-900 text-gray-900'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm truncate ${
                      !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {formatSenderName(email.from)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Action buttons on hover with text labels */}
                    {showActions && (onArchive || onTrash) && (
                      <div className="flex items-center gap-1 mr-2">
                        {onArchive && (
                          <button
                            onClick={(e) => handleArchiveClick(e, email)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                          >
                            <Archive className="h-3 w-3" />
                            <span>Archive</span>
                          </button>
                        )}
                        {onTrash && (
                          <button
                            onClick={(e) => handleTrashClick(e, email)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                    {!showActions && (
                      <span className="text-xs text-gray-400">
                        {formatDate(email.date)}
                      </span>
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm truncate mt-0.5 ${
                    !email.isRead ? 'font-medium text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {email.subject || '(No subject)'}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {email.snippet}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
