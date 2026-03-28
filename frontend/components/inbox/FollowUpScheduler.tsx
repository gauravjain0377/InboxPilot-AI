'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, X, Send, Timer, Zap, Edit3 } from 'lucide-react';

interface FollowUpSchedulerProps {
  threadId: string;
  messageId: string;
  to: string;
  subject: string;
  onClose: () => void;
  onScheduled: () => void;
}

export default function FollowUpScheduler({
  threadId,
  messageId,
  to,
  subject,
  onClose,
  onScheduled,
}: FollowUpSchedulerProps) {
  const [delayDays, setDelayDays] = useState<number>(2);
  const [mode, setMode] = useState<'manual' | 'auto' | 'hybrid'>('manual');
  const [tone, setTone] = useState<'friendly' | 'formal' | 'assertive' | 'short'>('friendly');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customDelay, setCustomDelay] = useState('');

  const presets = [1, 2, 3, 5, 7];

  const applyDelay = (delay: number) => {
    if (!Number.isFinite(delay) || delay < 1) return;
    setDelayDays(delay);
  };

  const handleSchedule = async () => {
    if (!delayDays || delayDays < 1) {
      setError('Choose after how many days to follow up');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await api.post('/followup/config', {
        threadId,
        messageId,
        to,
        subject,
        delayDays,
        delays: [delayDays],
        mode,
        tone,
        timeOfDay,
      });
      onScheduled();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to schedule follow-ups');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-3 sm:px-6 py-4 shrink-0 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Schedule Follow-up</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Delay presets */}
        <div>
          <Label className="text-xs text-gray-500 mb-2 block">Follow up after (days)</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => applyDelay(val)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  delayDays === val
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {val} day{val > 1 ? 's' : ''}
              </button>
            ))}
            {/* Custom add */}
            <div className="flex gap-1">
              <input
                type="number"
                min="1"
                max="90"
                placeholder="custom"
                value={customDelay}
                onChange={(e) => setCustomDelay(e.target.value)}
                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = parseInt(customDelay, 10);
                    if (val > 0) {
                      applyDelay(val);
                      setCustomDelay('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(customDelay, 10);
                  if (val > 0) {
                    applyDelay(val);
                    setCustomDelay('');
                  }
                }}
                className="px-2 py-1 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Follow-up will be sent after <span className="font-semibold">{delayDays} day{delayDays > 1 ? 's' : ''}</span> if there is no reply.
        </div>

        {/* Mode + Tone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Mode</Label>
            <div className="space-y-1">
              {([
                { key: 'manual', label: 'Manual', desc: 'Review before send', icon: Edit3 },
                { key: 'auto', label: 'Auto', desc: 'Send directly', icon: Zap },
                { key: 'hybrid', label: 'Hybrid', desc: '1st manual, rest auto', icon: Timer },
              ] as const).map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-left transition-colors ${
                    mode === key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <div>
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] opacity-70 ml-1">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* Time Picker */}
            <div className="mt-3">
              <Label className="text-xs text-gray-500 mb-1.5 block">Time of Day</Label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Tone</Label>
            <div className="space-y-1">
              {(['friendly', 'formal', 'assertive', 'short'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-md text-left capitalize transition-colors ${
                    tone === t
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

        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSchedule}
            disabled={saving || delayDays < 1}
            className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <span className="animate-spin mr-1">⏳</span>
            ) : (
              <Send className="w-3 h-3 mr-1" />
            )}
            Schedule Follow-up
          </Button>
        </div>
      </div>
    </div>
  );
}
