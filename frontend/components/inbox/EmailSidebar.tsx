'use client';

import { Inbox, Star, Send, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailTab } from './types';

interface EmailSidebarProps {
  activeTab: EmailTab;
  unreadCount: number;
  syncing: boolean;
  onTabChange: (tab: EmailTab) => void;
  onSync: () => void;
  onClose?: () => void;
}

export default function EmailSidebar({
  activeTab,
  unreadCount,
  syncing,
  onTabChange,
  onSync,
  onClose,
}: EmailSidebarProps) {
  const tabs = [
    { id: 'inbox' as EmailTab, label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'starred' as EmailTab, label: 'Starred', icon: Star },
    { id: 'sent' as EmailTab, label: 'Sent', icon: Send },
  ];

  return (
    <aside className="w-48 bg-white border-r border-gray-200 p-3 shrink-0 flex flex-col h-full">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="flex items-center justify-between mb-3 lg:hidden">
          <span className="font-medium text-gray-900 text-sm">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}
      
      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          className="w-full border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>
      
      <nav className="space-y-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-auto bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
