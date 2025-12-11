import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { DashboardStats } from './types';

interface AIActivityProps {
  stats: DashboardStats;
}

export default function AIActivity({ stats }: AIActivityProps) {
  const totalAIUsage =
    (stats.aiUsageBreakdown?.reply || 0) +
    (stats.aiUsageBreakdown?.summarize || 0) +
    (stats.aiUsageBreakdown?.rewrite || 0) +
    (stats.aiUsageBreakdown?.followup || 0);

  if (totalAIUsage === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm mb-8">
      <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">AI Activity</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          Usage of InboxPilot AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">AI Replies</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.aiUsageBreakdown?.reply ?? 0}</p>
            <p className="text-xs text-slate-500">Drafts generated with AI</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Summaries</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.aiUsageBreakdown?.summarize ?? 0}</p>
            <p className="text-xs text-slate-500">Emails summarized</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Rewrites</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.aiUsageBreakdown?.rewrite ?? 0}</p>
            <p className="text-xs text-slate-500">Texts refined or expanded</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Follow-ups</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.aiUsageBreakdown?.followup ?? 0}</p>
            <p className="text-xs text-slate-500">Follow-up emails drafted</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

