'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Check } from 'lucide-react';

type Tone = 'formal' | 'friendly' | 'assertive' | 'short';

interface ComposeFormProps {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  showCc: boolean;
  showBcc: boolean;
  selectedTone: Tone;
  aiSuggestion: string | null;
  onToChange: (value: string) => void;
  onCcChange: (value: string) => void;
  onBccChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onShowCcChange: (show: boolean) => void;
  onShowBccChange: (show: boolean) => void;
  onToneChange: (tone: Tone) => void;
  onUseSuggestion: () => void;
  onDismissSuggestion: () => void;
}

export default function ComposeForm({
  to,
  cc,
  bcc,
  subject,
  body,
  showCc,
  showBcc,
  selectedTone,
  aiSuggestion,
  onToChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
  onBodyChange,
  onShowCcChange,
  onShowBccChange,
  onToneChange,
  onUseSuggestion,
  onDismissSuggestion,
}: ComposeFormProps) {
  const tones: Tone[] = ['formal', 'friendly', 'assertive', 'short'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Recipients */}
      <div className="border-b border-gray-100">
        <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3">
          <Label className="w-10 sm:w-14 text-xs sm:text-sm text-gray-500 shrink-0">To</Label>
          <Input
            type="email"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
          />
          <div className="flex items-center gap-2 text-xs shrink-0 ml-2">
            {!showCc && (
              <button
                type="button"
                onClick={() => onShowCcChange(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => onShowBccChange(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* CC Field */}
        {showCc && (
          <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100">
            <Label className="w-10 sm:w-14 text-xs sm:text-sm text-gray-500 shrink-0">Cc</Label>
            <Input
              type="email"
              value={cc}
              onChange={(e) => onCcChange(e.target.value)}
              placeholder="cc@example.com"
              className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
            />
            <button
              type="button"
              onClick={() => {
                onShowCcChange(false);
                onCcChange('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100">
            <Label className="w-10 sm:w-14 text-xs sm:text-sm text-gray-500 shrink-0">Bcc</Label>
            <Input
              type="email"
              value={bcc}
              onChange={(e) => onBccChange(e.target.value)}
              placeholder="bcc@example.com"
              className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
            />
            <button
              type="button"
              onClick={() => {
                onShowBccChange(false);
                onBccChange('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Subject */}
      <div className="border-b border-gray-100">
        <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3">
          <Label className="w-10 sm:w-14 text-xs sm:text-sm text-gray-500 shrink-0">Subject</Label>
          <Input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Email subject"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 font-medium text-sm text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
          />
        </div>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="border-b border-gray-100 bg-gray-50 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enhanced Version
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {aiSuggestion}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onDismissSuggestion}
                className="text-xs h-8 border-gray-200 flex-1 sm:flex-none"
              >
                Dismiss
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onUseSuggestion}
                className="text-xs h-8 bg-gray-900 hover:bg-gray-800 text-white flex-1 sm:flex-none"
              >
                <Check className="h-3 w-3 mr-1" />
                Use
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-3 sm:p-4">
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Write your message..."
          className="w-full min-h-[200px] sm:min-h-[280px] text-sm text-gray-700 leading-relaxed resize-none focus:outline-none placeholder:text-gray-400 bg-transparent"
        />
      </div>

      {/* Tone Options */}
      <div className="border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-gray-500 shrink-0">Tone:</span>
            {tones.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => onToneChange(tone)}
                className={`px-2 sm:px-2.5 py-1 text-xs rounded-full transition-colors shrink-0 ${
                  selectedTone === tone
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 shrink-0">{body.length} chars</div>
        </div>
      </div>
    </div>
  );
}
