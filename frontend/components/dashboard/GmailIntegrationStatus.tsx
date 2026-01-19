import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { DashboardStats } from './types';

interface GmailIntegrationStatusProps {
  stats: DashboardStats;
}

export default function GmailIntegrationStatus({ stats }: GmailIntegrationStatusProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Gmail Add-on</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          Use InboxPilot AI directly in Gmail
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Gmail Account Connected</p>
            <p className="text-xs text-slate-500">
              Your Gmail account <span className="font-semibold">{stats.userInfo.email}</span> is connected.
              Install the Gmail Add-on to use AI features directly in Gmail.
            </p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-slate-900 mb-2">How to use InboxPilot in Gmail:</p>
          <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
            <li>Open Gmail in your browser</li>
            <li>Look for "InboxPilot AI" in the Gmail menu</li>
            <li>Click it to open the sidebar with AI features</li>
            <li>Select any email and use AI features like Summarize, Generate Reply, etc.</li>
          </ol>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Open Gmail <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

