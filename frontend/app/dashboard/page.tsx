'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, Clock, TrendingUp, Zap, Settings, ExternalLink, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useUserStore();
  const [stats, setStats] = useState({
    emailsProcessed: 0,
    aiDrafts: 0,
    timeSaved: 0,
    followUps: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gmail/messages?maxResults=50');
      const emails = data.emails || [];
      
      setStats({
        emailsProcessed: emails.length,
        aiDrafts: emails.filter((e: any) => e.aiSuggestions?.length > 0).length,
        timeSaved: emails.length * 5,
        followUps: emails.filter((e: any) => e.priority === 'high').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InboxPilot AI
              </h1>
              <p className="text-xs text-slate-500">Executive Email Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 font-medium">{user.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋
          </h2>
          <p className="text-slate-600">
            Here's what's happening with your inbox today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100">
                Emails Processed
              </CardTitle>
              <Mail className="h-5 w-5 text-indigo-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '...' : stats.emailsProcessed}</div>
              <p className="text-xs text-indigo-200 mt-1">Total emails analyzed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                AI Drafts Generated
              </CardTitle>
              <Sparkles className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '...' : stats.aiDrafts}</div>
              <p className="text-xs text-purple-200 mt-1">AI-powered replies created</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">
                Time Saved
              </CardTitle>
              <Clock className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '...' : stats.timeSaved}</div>
              <p className="text-xs text-emerald-200 mt-1">Minutes saved this week</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">
                High Priority
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '...' : stats.followUps}</div>
              <p className="text-xs text-amber-200 mt-1">Emails requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Access your inbox and compose emails with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/inbox">
                <Button className="w-full justify-start h-14 text-left" variant="outline">
                  <Mail className="h-5 w-5 mr-3 text-indigo-600" />
                  <div className="flex-1">
                    <div className="font-semibold">View Inbox</div>
                    <div className="text-xs text-slate-500">Browse and manage your emails</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
              <Link href="/compose">
                <Button className="w-full justify-start h-14 text-left" variant="outline">
                  <Sparkles className="h-5 w-5 mr-3 text-purple-600" />
                  <div className="flex-1">
                    <div className="font-semibold">Compose with AI</div>
                    <div className="text-xs text-slate-500">Create emails with AI assistance</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button className="w-full justify-start h-14 text-left" variant="outline">
                  <Settings className="h-5 w-5 mr-3 text-slate-600" />
                  <div className="flex-1">
                    <div className="font-semibold">Settings</div>
                    <div className="text-xs text-slate-500">Configure preferences and rules</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gmail Integration */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-indigo-600" />
                Gmail Integration
              </CardTitle>
              <CardDescription>
                Use InboxPilot directly in your Gmail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h4 className="font-semibold text-sm mb-2 text-slate-900">Chrome Extension</h4>
                <p className="text-xs text-slate-600 mb-3">
                  Install the extension to get AI features directly in Gmail
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  Install Extension
                </Button>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-sm mb-2 text-slate-900">Gmail Add-on</h4>
                <p className="text-xs text-slate-600 mb-3">
                  Add sidebar panel in Gmail with AI tools
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  Install Add-on
                </Button>
              </div>
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Open Gmail
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <div className="mt-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-indigo-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Install Extension</h4>
                  <p className="text-sm text-slate-600">
                    Add InboxPilot to your browser to enable AI features in Gmail
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Use in Gmail</h4>
                  <p className="text-sm text-slate-600">
                    All AI features appear directly in your Gmail inbox - replies, priorities, labels
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-emerald-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Save Time</h4>
                  <p className="text-sm text-slate-600">
                    Let AI handle routine tasks while you focus on what matters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
