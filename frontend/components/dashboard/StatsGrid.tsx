import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { formatTime } from './utils';
import { DashboardStats } from './types';

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">
            Total Emails
          </CardTitle>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Mail className="h-5 w-5 text-slate-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalEmails}</div>
          <p className="text-xs text-slate-500">Emails processed</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">
            AI Drafts
          </CardTitle>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-slate-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.emailsWithAI}</div>
          <p className="text-xs text-slate-500">AI-powered replies</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">
            Time Saved
          </CardTitle>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-slate-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-1">{formatTime(stats.timeSavedMinutes)}</div>
          <p className="text-xs text-slate-500">Estimated time saved</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">
            High Priority
          </CardTitle>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-slate-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.highPriorityEmails}</div>
          <p className="text-xs text-slate-500">Requiring attention</p>
        </CardContent>
      </Card>
    </div>
  );
}

