'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import AppShell from '@/components/layout/AppShell';
import StatsGrid from '@/components/dashboard/StatsGrid';
import PriorityBreakdown from '@/components/dashboard/PriorityBreakdown';
import AccountInfo from '@/components/dashboard/AccountInfo';
import CategoryStats from '@/components/dashboard/CategoryStats';
import EmailActivity from '@/components/dashboard/EmailActivity';
import AIActivity from '@/components/dashboard/AIActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import {
  Inbox,
  Send,
  RefreshCw,
  Mail,
  Sparkles,
  TrendingUp,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { DashboardStats } from '@/components/dashboard/types';

export default function DashboardPage() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/analytics/dashboard');
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      await api.get('/gmail/messages?maxResults=100');
      await fetchStats();
      setToast({ message: 'Emails synced successfully', type: 'success' });
    } catch (error) {
      console.error('Error syncing emails:', error);
      setToast({ message: 'Failed to sync emails', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your emails with AI-powered assistance
              </p>
            </div>
            <Button
              variant="outline"
              onClick={syncEmails}
              disabled={syncing}
              className="shrink-0 border-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Emails'}
            </Button>
          </div>

          {/* Quick Action Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/inbox">
              <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group bg-white">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Inbox className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">Open Inbox</h3>
                    <p className="text-sm text-gray-500">
                      Read and manage your emails
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600">
                    <span className="text-sm font-medium">{stats?.totalEmails || 0}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/compose">
              <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group bg-white">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">Compose Email</h3>
                    <p className="text-sm text-gray-500">
                      Write with AI assistance
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* AI Features */}
        <Card className="mb-8 border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              AI Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Summarize</p>
                  <p className="text-xs text-gray-500">Quick summaries</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Send className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Smart Reply</p>
                  <p className="text-xs text-gray-500">Generate responses</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Follow-up</p>
                  <p className="text-xs text-gray-500">Create follow-ups</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Enhance</p>
                  <p className="text-xs text-gray-500">Improve writing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : stats ? (
          <>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Analytics
            </h2>
            
            <StatsGrid stats={stats} />

            {/* Row with Priority Breakdown and Account Info - both equal size */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <PriorityBreakdown stats={stats} />
              <AccountInfo stats={stats} />
            </div>

            {/* Row with Category Stats and Email Activity */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <CategoryStats stats={stats} />
              <EmailActivity stats={stats} />
            </div>

            <AIActivity stats={stats} />
          </>
        ) : (
          <Card className="border-gray-200 bg-white">
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No email data yet
              </h3>
              <p className="text-gray-500 mb-4">
                Click &quot;Sync Emails&quot; to fetch your emails
              </p>
              <Button 
                onClick={syncEmails} 
                disabled={syncing}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppShell>
  );
}
