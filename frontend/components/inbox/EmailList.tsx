'use client';

import { useState, useRef } from 'react';
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

interface SwipeState {
  emailId: string | null;
  offset: number;
  direction: 'left' | 'right' | null;
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
  const [swipeState, setSwipeState] = useState<SwipeState>({ emailId: null, offset: 0, direction: null });
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

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

  const handleTouchStart = (e: React.TouchEvent, emailId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setSwipeState({ emailId, offset: 0, direction: null });
  };

  const handleTouchMove = (e: React.TouchEvent, emailId: string) => {
    if (swipeState.emailId !== emailId) return;
    
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    const maxOffset = 100;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    
    setSwipeState({
      emailId,
      offset: clampedOffset,
      direction: clampedOffset > 30 ? 'right' : clampedOffset < -30 ? 'left' : null,
    });
  };

  const handleTouchEnd = (email: Email) => {
    if (swipeState.direction === 'right' && onArchive) {
      onArchive(email);
    } else if (swipeState.direction === 'left' && onTrash) {
      onTrash(email);
    }
    setSwipeState({ emailId: null, offset: 0, direction: null });
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
        const isSwipingThis = swipeState.emailId === email.gmailId;
        const offset = isSwipingThis ? swipeState.offset : 0;
        const showActions = hoveredEmail === email.gmailId;

        return (
          <div
            key={email.gmailId}
            className="relative overflow-hidden"
            onMouseEnter={() => setHoveredEmail(email.gmailId)}
            onMouseLeave={() => setHoveredEmail(null)}
          >
            {/* Swipe action backgrounds */}
            <div className="absolute inset-0 flex">
              {/* Archive (swipe right) */}
              <div 
                className={`flex items-center justify-start pl-4 transition-colors ${
                  swipeState.direction === 'right' && isSwipingThis
                    ? 'bg-green-500'
                    : 'bg-green-400'
                }`}
                style={{ width: Math.max(0, offset) }}
              >
                {offset > 30 && (
                  <Archive className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1" />
              {/* Trash (swipe left) */}
              <div 
                className={`flex items-center justify-end pr-4 transition-colors ${
                  swipeState.direction === 'left' && isSwipingThis
                    ? 'bg-red-500'
                    : 'bg-red-400'
                }`}
                style={{ width: Math.max(0, -offset) }}
              >
                {offset < -30 && (
                  <Trash2 className="h-5 w-5 text-white" />
                )}
              </div>
            </div>

            {/* Email content */}
            <div
              onClick={() => onSelectEmail(email)}
              onTouchStart={(e) => handleTouchStart(e, email.gmailId)}
              onTouchMove={(e) => handleTouchMove(e, email.gmailId)}
              onTouchEnd={() => handleTouchEnd(email)}
              className={`relative px-3 py-2.5 cursor-pointer transition-all bg-white ${
                selectedEmail?.gmailId === email.gmailId
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              } ${!email.isRead ? 'bg-white' : ''}`}
              style={{
                transform: `translateX(${offset}px)`,
                transition: isSwipingThis ? 'none' : 'transform 0.2s ease-out',
              }}
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
                      {/* Action buttons on hover */}
                      {showActions && (onArchive || onTrash) && (
                        <div className="flex items-center gap-1 mr-2">
                          {onArchive && (
                            <button
                              onClick={(e) => handleArchiveClick(e, email)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onTrash && (
                            <button
                              onClick={(e) => handleTrashClick(e, email)}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(email.date)}
                      </span>
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
          </div>
        );
      })}
    </div>
  );
}
