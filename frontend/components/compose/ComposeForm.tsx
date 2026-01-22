'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Check } from 'lucide-react';

type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

interface ComposeFormProps {
  to: string;
  cc: string;
  subject: string;
  body: string;
  showCc: boolean;
  selectedTone: Tone;
  aiSuggestion: string | null;
  onToChange: (value: string) => void;
  onCcChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onShowCcChange: (show: boolean) => void;
  onToneChange: (tone: Tone) => void;
  onUseSuggestion: () => void;
  onDismissSuggestion: () => void;
}

export default function ComposeForm({
  to,
  cc,
  subject,
  body,
  showCc,
  selectedTone,
  aiSuggestion,
  onToChange,
  onCcChange,
  onSubjectChange,
  onBodyChange,
  onShowCcChange,
  onToneChange,
  onUseSuggestion,
  onDismissSuggestion,
}: ComposeFormProps) {
  const tones: Tone[] = ['formal', 'friendly', 'assertive', 'short'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Recipients */}
      <div className="border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <Label className="w-14 text-sm text-gray-500">To</Label>
          <Input
            type="email"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-gray-900"
          />
          {!showCc && (
            <button
              onClick={() => onShowCcChange(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cc
            </button>
          )}
        </div>

        {showCc && (
          <div className="flex items-center px-4 py-3 border-t border-gray-100">
            <Label className="w-14 text-sm text-gray-500">Cc</Label>
            <Input
              type="email"
              value={cc}
              onChange={(e) => onCcChange(e.target.value)}
              placeholder="cc@example.com"
              className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-gray-900"
            />
            <button
              onClick={() => {
                onShowCcChange(false);
                onCcChange('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Subject */}
      <div className="border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <Label className="w-14 text-sm text-gray-500">Subject</Label>
          <Input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Email subject"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 font-medium text-gray-900"
          />
        </div>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="border-b border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enhanced Version
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiSuggestion}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={onDismissSuggestion}
                className="text-xs h-8 border-gray-200"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={onUseSuggestion}
                className="text-xs h-8 bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Check className="h-3 w-3 mr-1" />
                Use This
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Write your message..."
          className="w-full min-h-[280px] text-sm text-gray-700 leading-relaxed resize-none focus:outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Tone Options */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">AI Tone:</span>
            {tones.map((tone) => (
              <button
                key={tone}
                onClick={() => onToneChange(tone)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  selectedTone === tone
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400">{body.length} chars</div>
        </div>
      </div>
    </div>
  );
}
