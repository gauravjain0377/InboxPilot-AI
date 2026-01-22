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
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-600" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Email</p>
          <p className="text-sm font-medium text-gray-900">{stats.userInfo.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Member Since</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(stats.userInfo.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Account Age</p>
          <p className="text-sm font-medium text-gray-900">{stats.accountAge} days</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Unread Emails</p>
          <p className="text-sm font-medium text-gray-900">{stats.unreadEmails}</p>
        </div>
        <Link href="/settings">
          <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white mt-3">
            <Settings className="h-4 w-4 mr-2" />
            Manage Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
