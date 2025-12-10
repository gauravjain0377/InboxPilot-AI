'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, Clock, TrendingUp, Zap, Settings, ExternalLink, BarChart3, Download, Code, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const [showExtensionGuide, setShowExtensionGuide] = useState(false);
  const [showAddonGuide, setShowAddonGuide] = useState(false);

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">InboxPilot AI</h1>
              <p className="text-xs text-slate-500">Executive Email Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <Button variant="outline" size="sm" onClick={logout} className="border-slate-300">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">
            Welcome back, {user.name?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-slate-500 text-sm">
            Here's what's happening with your inbox today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Emails Processed
              </CardTitle>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900 mb-1">{loading ? '...' : stats.emailsProcessed}</div>
              <p className="text-xs text-slate-500">Total emails analyzed</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                AI Drafts Generated
              </CardTitle>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900 mb-1">{loading ? '...' : stats.aiDrafts}</div>
              <p className="text-xs text-slate-500">AI-powered replies created</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Time Saved
              </CardTitle>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900 mb-1">{loading ? '...' : stats.timeSaved}</div>
              <p className="text-xs text-slate-500">Minutes saved this week</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                High Priority
              </CardTitle>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900 mb-1">{loading ? '...' : stats.followUps}</div>
              <p className="text-xs text-slate-500">Emails requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-600" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Access your inbox and compose emails with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-6">
              <Link href="/inbox">
                <Button className="w-full justify-between h-12 text-left bg-white hover:bg-slate-50 border border-slate-200 text-slate-700" variant="outline">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">View Inbox</div>
                      <div className="text-xs text-slate-500">Browse and manage your emails</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
              <Link href="/compose">
                <Button className="w-full justify-between h-12 text-left bg-white hover:bg-slate-50 border border-slate-200 text-slate-700" variant="outline">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Compose with AI</div>
                      <div className="text-xs text-slate-500">Create emails with AI assistance</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button className="w-full justify-between h-12 text-left bg-white hover:bg-slate-50 border border-slate-200 text-slate-700" variant="outline">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Settings</div>
                      <div className="text-xs text-slate-500">Configure preferences and rules</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gmail Integration */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-slate-600" />
                Gmail Integration
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Install extensions to use AI features directly in Gmail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {/* Chrome Extension */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-slate-900">Chrome Extension</h4>
                    <p className="text-xs text-slate-500">
                      Get AI features directly in Gmail inbox
                    </p>
                  </div>
                  <Code className="h-4 w-4 text-slate-600 flex-shrink-0" />
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={() => setShowExtensionGuide(!showExtensionGuide)}
                >
                  {showExtensionGuide ? 'Hide' : 'Show'} Installation Guide
                </Button>
                
                {showExtensionGuide && (
                  <div className="mt-3 p-3 bg-white rounded border border-slate-200 text-xs space-y-2">
                    <div className="font-semibold text-slate-900 mb-2">Quick Install:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Open Chrome → <code className="bg-slate-100 px-1 rounded text-xs">chrome://extensions/</code></li>
                      <li>Enable <strong>Developer mode</strong> (top-right)</li>
                      <li>Click <strong>Load unpacked</strong></li>
                      <li>Select folder: <code className="bg-slate-100 px-1 rounded text-xs">extension/</code></li>
                      <li>Refresh Gmail page</li>
                    </ol>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <strong className="text-slate-700">Extension Name:</strong> <span className="text-slate-600">InboxPilot AI - Gmail Assistant</span>
                    </div>
                    <div className="mt-1">
                      <strong className="text-slate-700">Location:</strong> <code className="bg-slate-100 px-1 rounded text-xs">F:\InboxPilot-AI\extension\</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Gmail Add-on */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-slate-900">Gmail Add-on</h4>
                    <p className="text-xs text-slate-500">
                      Sidebar panel in Gmail with AI tools
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-slate-600 flex-shrink-0" />
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={() => setShowAddonGuide(!showAddonGuide)}
                >
                  {showAddonGuide ? 'Hide' : 'Show'} Installation Guide
                </Button>
                
                {showAddonGuide && (
                  <div className="mt-3 p-3 bg-white rounded border border-slate-200 text-xs space-y-2">
                    <div className="font-semibold text-slate-900 mb-2">Quick Install:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Go to <a href="https://script.google.com" target="_blank" className="text-slate-900 underline">script.google.com</a></li>
                      <li>Create new project: <strong>InboxPilot AI</strong></li>
                      <li>Copy code from <code className="bg-slate-100 px-1 rounded text-xs">addon/main.gs</code></li>
                      <li>Create HTML file: <code className="bg-slate-100 px-1 rounded text-xs">sidebar.html</code></li>
                      <li>Deploy as Gmail add-on</li>
                    </ol>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <strong className="text-slate-700">Files Location:</strong> <code className="bg-slate-100 px-1 rounded text-xs">F:\InboxPilot-AI\addon\</code>
                    </div>
                  </div>
                )}
              </div>

              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                  Open Gmail
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-semibold text-slate-700">1</span>
                </div>
                <h4 className="font-semibold text-sm mb-2 text-slate-900">Install Extension</h4>
                <p className="text-xs text-slate-500">
                  Add InboxPilot to your browser to enable AI features in Gmail
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-semibold text-slate-700">2</span>
                </div>
                <h4 className="font-semibold text-sm mb-2 text-slate-900">Use in Gmail</h4>
                <p className="text-xs text-slate-500">
                  All AI features appear directly in your Gmail inbox - replies, priorities, labels
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-semibold text-slate-700">3</span>
                </div>
                <h4 className="font-semibold text-sm mb-2 text-slate-900">Save Time</h4>
                <p className="text-xs text-slate-500">
                  Let AI handle routine tasks while you focus on what matters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
