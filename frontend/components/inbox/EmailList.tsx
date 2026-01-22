'use client';

import { useState } from 'react';
import { Star, MailOpen, Loader2, AlertCircle, Archive, Trash2, Paperclip } from 'lucide-react';
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
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    }
  };

  const formatSenderName = (from: string) => {
    const match = from.match(/^([^<]+)/);
    const name = match ? match[1].trim().replace(/"/g, '') : from;
    // Truncate long names
    return name.length > 20 ? name.slice(0, 20) + '...' : name;
  };

  const getInitials = (from: string) => {
    const match = from.match(/^([^<]+)/);
    const name = match ? match[1].trim().replace(/"/g, '') : from;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (from: string) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
      'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    ];
    const hash = from.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return '';
    }
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Loading emails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-sm text-gray-700 font-medium mb-1">Failed to load emails</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry} className="text-sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <MailOpen className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">No emails here</p>
        <p className="text-xs text-gray-500 mt-1">
          {activeTab === 'inbox' && 'Your inbox is empty'}
          {activeTab === 'sent' && 'No sent messages'}
          {activeTab === 'starred' && 'No starred messages'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {emails.map((email) => {
        const isSelected = selectedEmail?.gmailId === email.gmailId;
        const isHovered = hoveredEmail === email.gmailId;

        return (
          <div
            key={email.gmailId}
            onClick={() => onSelectEmail(email)}
            onMouseEnter={() => setHoveredEmail(email.gmailId)}
            onMouseLeave={() => setHoveredEmail(null)}
            className={`
              group relative px-3 py-3 cursor-pointer transition-all duration-150
              ${isSelected 
                ? 'bg-blue-50 border-l-2 border-l-blue-500' 
                : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }
              ${!email.isRead ? 'bg-white' : 'bg-gray-50/50'}
            `}
          >
            <div className="flex items-start gap-3">
              {/* Avatar or Star */}
              <div className="relative shrink-0 mt-0.5">
                {/* Avatar - hidden on hover */}
                <div 
                  className={`w-8 h-8 rounded-full ${getAvatarColor(email.from)} flex items-center justify-center text-white text-xs font-medium transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                >
                  {getInitials(email.from)}
                </div>
                {/* Star button - shown on hover or when starred */}
                <button
                  onClick={(e) => onToggleStar(email, e)}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity ${isHovered || email.isStarred ? 'opacity-100' : 'opacity-0'}`}
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      email.isStarred
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  />
                </button>
              </div>

              {/* Email Content */}
              <div className="flex-1 min-w-0">
                {/* Sender and Date Row */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className={`text-sm truncate ${
                      !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                    }`}
                  >
                    {formatSenderName(email.from)}
                  </span>
                  
                  {/* Actions or Date */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isHovered && (onArchive || onTrash) ? (
                      <div className="flex items-center gap-0.5">
                        {onArchive && (
                          <button
                            onClick={(e) => handleArchiveClick(e, email)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        {onTrash && (
                          <button
                            onClick={(e) => handleTrashClick(e, email)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className={`text-xs ${!email.isRead ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {formatDate(email.date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <p
                  className={`text-sm truncate ${
                    !email.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {email.subject || '(No subject)'}
                </p>

                {/* Snippet */}
                <p className="text-xs text-gray-500 truncate mt-0.5 leading-relaxed">
                  {email.snippet}
                </p>

                {/* Tags Row */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {/* Priority Badge */}
                  {email.priority && email.priority !== 'medium' && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getPriorityColor(email.priority)}`}>
                      {email.priority === 'high' ? 'Important' : 'Low Priority'}
                    </span>
                  )}
                  
                  {/* Category Badge */}
                  {email.category && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                      {email.category}
                    </span>
                  )}
                  
                  {/* Attachment indicator */}
                  {email.labels?.includes('ATTACHMENT') && (
                    <Paperclip className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Unread indicator dot */}
            {!email.isRead && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}
