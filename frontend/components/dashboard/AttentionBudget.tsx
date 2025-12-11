import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatTime } from './utils';
import { AttentionOverview } from './types';

interface AttentionBudgetProps {
  attention: AttentionOverview;
}

export default function AttentionBudget({ attention }: AttentionBudgetProps) {
  if (attention.today.total === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Attention Budget (Last 7 Days)</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          Estimated time you needed for unread emails in the past week
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Today&apos;s load</p>
            <p className="text-2xl font-semibold text-slate-900">{formatTime(attention.today.estimatedMinutes)}</p>
            <p className="text-xs text-slate-500">
              {attention.today.high} high • {attention.today.medium} medium • {attention.today.low} low priority
              emails
            </p>
          </div>
          <div className="space-y-2">
            {attention.days.slice(0, 7).map((day) => (
              <div key={day.date} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 mx-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-slate-900"
                    style={{
                      width: `${Math.min(100, (day.estimatedMinutes / Math.max(30, attention.today.estimatedMinutes || 30)) * 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-slate-700">{day.estimatedMinutes} min</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

