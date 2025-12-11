import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { CommunicationInsights } from './types';

interface CommunicationCoachProps {
  communication: CommunicationInsights;
}

export default function CommunicationCoach({ communication }: CommunicationCoachProps) {
  if (communication.totalSent + communication.totalReceived === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Communication Coach</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          How you write and respond over time
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sent vs received</p>
            <p className="text-xl font-semibold text-slate-900">
              {communication.totalSent} / {communication.totalReceived}
            </p>
            <p className="text-xs text-slate-500">Emails you sent vs emails received (last 90 days)</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Typical response time</p>
            <p className="text-xl font-semibold text-slate-900">
              {communication.medianResponseMinutes != null ? `${communication.medianResponseMinutes} min` : '—'}
            </p>
            <p className="text-xs text-slate-500">Median time to reply in a thread</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Average reply length</p>
            <p className="text-xl font-semibold text-slate-900">{communication.avgReplyLengthWords} words</p>
            <p className="text-xs text-slate-500">Good target is 60–120 words for clear replies</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">AI assist rate</p>
            <p className="text-xl font-semibold text-slate-900">{Math.round((communication.aiReplyRate || 0) * 100)}%</p>
            <p className="text-xs text-slate-500">Percent of replies generated with InboxPilot</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

