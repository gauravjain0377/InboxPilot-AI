'use client';

import { Reply, Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyBoxProps {
  showReply: boolean;
  replyBody: string;
  sendingReply: boolean;
  aiLoading: string | null;
  onSetShowReply: (show: boolean) => void;
  onSetReplyBody: (body: string) => void;
  onSendReply: () => void;
  onGenerateReply: (tone: string) => void;
}

export default function ReplyBox({
  showReply,
  replyBody,
  sendingReply,
  aiLoading,
  onSetShowReply,
  onSetReplyBody,
  onSendReply,
  onGenerateReply,
}: ReplyBoxProps) {
  if (!showReply) {
    return (
      <div className="border-t border-gray-100 p-3 shrink-0 bg-white">
        <Button
          onClick={() => onSetShowReply(true)}
          variant="outline"
          className="w-full border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 shrink-0 bg-white">
      {/* Reply Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">Reply</span>
        <button
          onClick={() => {
            onSetShowReply(false);
            onSetReplyBody('');
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tone Options */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">AI Tone:</span>
        <button
          onClick={() => onGenerateReply('formal')}
          disabled={aiLoading !== null}
          className="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          Formal
        </button>
        <button
          onClick={() => onGenerateReply('friendly')}
          disabled={aiLoading !== null}
          className="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          Friendly
        </button>
        <button
          onClick={() => onGenerateReply('short')}
          disabled={aiLoading !== null}
          className="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          Short
        </button>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={replyBody}
          onChange={(e) => onSetReplyBody(e.target.value)}
          placeholder="Write your reply..."
          className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 resize-none bg-white text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onSetShowReply(false);
            onSetReplyBody('');
          }}
          className="text-gray-500"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSendReply}
          disabled={sendingReply || !replyBody.trim()}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4"
        >
          {sendingReply ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}
