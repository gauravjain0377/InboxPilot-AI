import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { DashboardStats } from './types';

interface GmailIntegrationStatusProps {
  stats: DashboardStats;
  onUpdate: () => void;
}

export default function GmailIntegrationStatus({ stats, onUpdate }: GmailIntegrationStatusProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Gmail Integration Status</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          Control which Gmail account has InboxPilot enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex flex-col gap-4">
        {stats.userInfo.extensionConnected ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Gmail Connected</p>
              <p className="text-xs text-slate-500">
                InboxPilot features are active for <span className="font-semibold">{stats.userInfo.email}</span>.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await api.post('/auth/extension/disconnect');
                  onUpdate();
                } catch (err) {
                  console.error('Error disconnecting extension:', err);
                }
              }}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Not connected</p>
              <p className="text-xs text-slate-500">
                Install the InboxPilot Chrome extension, then open the Settings page and click{' '}
                <span className="font-semibold">Connect Chrome Extension</span> to enable it for this Gmail account.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.href = '/settings';
              }}
              className="mr-2"
            >
              Settings
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onUpdate} title="Refresh connection status">
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

