'use client';

import { Input } from '@/components/ui/input';
import { MultiEmailInput } from '@/components/ui/multi-email-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Check, Clock, Settings2 } from 'lucide-react';

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
  followUpEnabled: boolean;
  followUpDelays: number[];
  followUpMode: 'manual' | 'auto' | 'hybrid';
  onFollowUpEnabledChange: (enabled: boolean) => void;
  onFollowUpDelaysChange: (delays: number[]) => void;
  onFollowUpModeChange: (mode: 'manual' | 'auto' | 'hybrid') => void;
  followUpTone: Tone;
  onFollowUpToneChange: (tone: Tone) => void;
  followUpTime: string;
  onFollowUpTimeChange: (time: string) => void;
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
  followUpEnabled,
  followUpDelays,
  followUpMode,
  onFollowUpEnabledChange,
  onFollowUpDelaysChange,
  onFollowUpModeChange,
  followUpTone,
  onFollowUpToneChange,
  followUpTime,
  onFollowUpTimeChange,
}: ComposeFormProps) {
  const tones: Tone[] = ['formal', 'friendly', 'assertive', 'short'];
  const selectedDelay = followUpDelays[0] || 2;

  const applyDelay = (delay: number) => {
    if (!Number.isFinite(delay) || delay < 1) return;
    onFollowUpDelaysChange([delay]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Recipients */}
      <div className="border-b border-gray-100">
        <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3">
          <Label className="w-10 sm:w-14 text-xs sm:text-sm text-gray-500 shrink-0">To</Label>
          <MultiEmailInput
            value={to}
            onChange={(val) => onToChange(val)}
            placeholder="recipient@example.com"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm text-gray-900 bg-transparent min-w-0"
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
            <MultiEmailInput
              value={cc}
              onChange={(val) => onCcChange(val)}
              placeholder="cc@example.com"
              className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm text-gray-900 bg-transparent min-w-0"
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
            <MultiEmailInput
              value={bcc}
              onChange={(val) => onBccChange(val)}
              placeholder="bcc@example.com"
              className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm text-gray-900 bg-transparent min-w-0"
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

      {/* Follow-up Settings */}
      <div className="border-t border-gray-100 px-3 sm:px-4 py-3 sm:py-4 bg-white rounded-b-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Automated Follow-ups</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={followUpEnabled}
              onChange={(e) => onFollowUpEnabledChange(e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {followUpEnabled && (
          <div className="pt-3 border-t border-gray-100 space-y-4">
            {/* Quick presets */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Follow up after (days)</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => applyDelay(val)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      selectedDelay === val
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {val} day{val > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom delay input */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Or enter custom days</Label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  placeholder="e.g. 10"
                  className="w-20 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (val > 0) {
                        applyDelay(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  id="custom-delay-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('custom-delay-input') as HTMLInputElement;
                    const val = parseInt(input?.value);
                    if (val > 0) {
                      applyDelay(val);
                      input.value = '';
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  Set
                </button>
              </div>
            </div>

            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Follow-up will be sent after <span className="font-semibold">{selectedDelay} day{selectedDelay > 1 ? 's' : ''}</span> if there is no reply.
            </div>
            
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Sending Mode</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onFollowUpModeChange('manual')}
                  className={`px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    followUpMode === 'manual'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Manual Review</div>
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">Approve before sending</div>
                </button>
                <button
                  type="button"
                  onClick={() => onFollowUpModeChange('auto')}
                  className={`px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    followUpMode === 'auto'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Auto Send</div>
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">Send automatically</div>
                </button>
                <button
                  type="button"
                  onClick={() => onFollowUpModeChange('hybrid')}
                  className={`px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    followUpMode === 'hybrid'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Hybrid</div>
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">Review 1st, auto later</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Follow-up Time */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Time of Day</Label>
                <input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => onFollowUpTimeChange(e.target.value)}
                  className="w-full sm:w-32 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                />
              </div>

              {/* Tone Selector */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Follow-up Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {(['friendly', 'formal', 'assertive', 'short'] as Tone[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onFollowUpToneChange(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                        followUpTone === t
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
