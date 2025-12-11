import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings } from 'lucide-react';
import { formatDate } from './utils';
import { DashboardStats } from './types';

interface AccountInfoProps {
  stats: DashboardStats;
}

export default function AccountInfo({ stats }: AccountInfoProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-700" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Email</p>
          <p className="text-sm font-medium text-slate-900">{stats.userInfo.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Member Since</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(stats.userInfo.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Account Age</p>
          <p className="text-sm font-medium text-slate-900">{stats.accountAge} days</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Unread Emails</p>
          <p className="text-sm font-medium text-slate-900">{stats.unreadEmails}</p>
        </div>
        <Link href="/settings">
          <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-4">
            <Settings className="h-4 w-4 mr-2" />
            Manage Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

