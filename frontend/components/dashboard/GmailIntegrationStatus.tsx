import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle2, Inbox, Send, Sparkles } from 'lucide-react';
import { DashboardStats } from './types';

interface GmailIntegrationStatusProps {
  stats: DashboardStats;
}

export default function GmailIntegrationStatus({ stats }: GmailIntegrationStatusProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Gmail Connected</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          Manage your inbox with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Gmail Account Connected</p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold">{stats.userInfo.email}</span> is connected. 
              You can read, reply, and manage emails with AI assistance.
            </p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-slate-900 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/inbox"
              className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Inbox className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Open Inbox</span>
            </Link>
            <Link
              href="/compose"
              className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Send className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Compose</span>
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-3 w-3" />
            <span>AI features: Summarize, Generate Reply, Follow-up, and more</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

