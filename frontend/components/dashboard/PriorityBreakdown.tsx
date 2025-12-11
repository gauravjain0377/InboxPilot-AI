import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { DashboardStats } from './types';

interface PriorityBreakdownProps {
  stats: DashboardStats;
}

export default function PriorityBreakdown({ stats }: PriorityBreakdownProps) {
  if (stats.totalEmails === 0) return null;

  return (
    <Card className="lg:col-span-2 border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-700" />
          Priority Breakdown
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Distribution of emails by priority level
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-900"></div>
              <span className="text-sm font-medium text-slate-700">High Priority</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">{stats.priorityBreakdown.high}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-slate-900 h-2 rounded-full transition-all"
              style={{ width: `${stats.totalEmails > 0 ? (stats.priorityBreakdown.high / stats.totalEmails) * 100 : 0}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <span className="text-sm font-medium text-slate-700">Medium Priority</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">{stats.priorityBreakdown.medium}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-slate-600 h-2 rounded-full transition-all"
              style={{ width: `${stats.totalEmails > 0 ? (stats.priorityBreakdown.medium / stats.totalEmails) * 100 : 0}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-sm font-medium text-slate-700">Low Priority</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">{stats.priorityBreakdown.low}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-slate-400 h-2 rounded-full transition-all"
              style={{ width: `${stats.totalEmails > 0 ? (stats.priorityBreakdown.low / stats.totalEmails) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

