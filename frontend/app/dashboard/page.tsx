'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Settings, 
  BarChart3, 
  User, 
  Calendar,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalEmails: number;
  emailsWithAI: number;
  highPriorityEmails: number;
  unreadEmails: number;
  timeSavedMinutes: number;
  accountAge: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  categoryStats: Array<{ name: string; count: number }>;
  emailsOverTime: Array<{ date: string; count: number }>;
  userInfo: {
    name: string;
    email: string;
    picture?: string;
    createdAt: string;
    preferences?: any;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
      const { data } = await api.get('/analytics/dashboard');
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">InboxPilot AI</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Executive Email Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">{user.email}</span>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout} className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {stats?.userInfo?.name?.split(' ')[0] || user.name?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-slate-600">
            Here's your email analytics and account overview
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-600">Loading analytics...</div>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
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

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              {/* Priority Breakdown */}
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

              {/* Account Info */}
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
            </div>

            {/* Category Stats & Activity */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              {/* Category Statistics */}
              {stats.categoryStats.length > 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-slate-700" />
                      Top Categories
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Most common email categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {stats.categoryStats.map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{category.name}</span>
                          <span className="text-sm font-semibold text-slate-900">{category.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Email Activity */}
              {stats.emailsOverTime.length > 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-700" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Emails processed in the last 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {stats.emailsOverTime.slice(-7).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{item.count} emails</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Gmail Integration Status */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-700" />
                  Gmail Integration Status
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Your Gmail account is connected and syncing
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <CheckCircle2 className="h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Gmail Connected</p>
                    <p className="text-xs text-slate-500">All features are active and working</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-600">No data available</div>
          </div>
        )}
      </div>
    </div>
  );
}
