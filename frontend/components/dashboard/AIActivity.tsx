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
    <Card className="border border-gray-200 bg-white mb-8">
      <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-600" />
          <CardTitle className="text-sm font-semibold text-gray-900">AI Activity</CardTitle>
        </div>
        <CardDescription className="text-xs text-gray-500">
          Usage of InboxPilot AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">AI Replies</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.aiUsageBreakdown?.reply ?? 0}</p>
            <p className="text-xs text-gray-500">Drafts generated</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Summaries</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.aiUsageBreakdown?.summarize ?? 0}</p>
            <p className="text-xs text-gray-500">Emails summarized</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Rewrites</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.aiUsageBreakdown?.rewrite ?? 0}</p>
            <p className="text-xs text-gray-500">Texts refined</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Follow-ups</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.aiUsageBreakdown?.followup ?? 0}</p>
            <p className="text-xs text-gray-500">Follow-ups drafted</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
