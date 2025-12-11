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
  CheckCircle2,
  Users,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalEmails: number;
  emailsWithAI: number;
  highPriorityEmails: number;
  unreadEmails: number;
  timeSavedMinutes: number;
  accountAge: number;
  aiUsageBreakdown?: {
    reply: number;
    summarize: number;
    rewrite: number;
    followup: number;
  };
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
    extensionConnected?: boolean;
  };
}

interface AttentionDaySummary {
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  estimatedMinutes: number;
}

interface AttentionOverview {
  today: AttentionDaySummary;
  days: AttentionDaySummary[];
}

interface DailyDigestItem {
  id: string;
  gmailId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  priority?: string;
  category?: string;
  hasAiSuggestion: boolean;
  hasSummary: boolean;
}

interface RelationshipSummary {
  contact: string;
  totalEmails: number;
  lastInteractionAt: string;
  lastSubject?: string;
  lastCategory?: string;
}

interface CommunicationInsights {
  totalSent: number;
  totalReceived: number;
  avgReplyLengthWords: number;
  medianResponseMinutes: number | null;
  aiReplyRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attention, setAttention] = useState<AttentionOverview | null>(null);
  const [digest, setDigest] = useState<DailyDigestItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipSummary[]>([]);
  const [communication, setCommunication] = useState<CommunicationInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [user, router]);

  // Refresh stats when window regains focus (user might have connected extension in another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchStats();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [dashboardRes, attentionRes, digestRes, relationshipsRes, communicationRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/attention'),
        api.get('/analytics/daily-digest'),
        api.get('/analytics/relationships'),
        api.get('/analytics/communication'),
      ]);

      setStats(dashboardRes.data.stats);
      setAttention(attentionRes.data.attention ?? null);
      setDigest(digestRes.data.items ?? []);
      setRelationships(relationshipsRes.data?.relationships?.topContacts ?? []);
      setCommunication(communicationRes.data?.communication ?? null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

            {/* AI Activity */}
            <Card className="border border-slate-200 bg-white shadow-sm mb-8">
              <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-700" />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    AI Activity
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-slate-500">
                  Usage of InboxPilot AI features
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">AI Replies</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {stats.aiUsageBreakdown?.reply ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Drafts generated with AI</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Summaries</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {stats.aiUsageBreakdown?.summarize ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Emails summarized</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Rewrites</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {stats.aiUsageBreakdown?.rewrite ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Texts refined or expanded</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Follow-ups</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {stats.aiUsageBreakdown?.followup ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Follow-up emails drafted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attention & Focus + Daily Digest */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-700" />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Attention Budget (Last 7 Days)
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-slate-500">
                  Estimated time you needed for unread emails in the past week
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {attention ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          Today&apos;s load
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {formatTime(attention.today.estimatedMinutes)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {attention.today.high} high • {attention.today.medium} medium •{' '}
                          {attention.today.low} low priority emails
                        </p>
                      </div>
                      <div className="space-y-2">
                        {attention.days.slice(0, 7).map((day) => (
                          <div key={day.date} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <div className="flex-1 mx-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-slate-900"
                                style={{
                                  width: `${Math.min(100, (day.estimatedMinutes / Math.max(30, attention.today.estimatedMinutes || 30)) * 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-slate-700">
                              {day.estimatedMinutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No unread emails to plan for.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-slate-700" />
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Today&apos;s Briefing
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-slate-500">
                    Top emails that deserve your attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {digest.length > 0 ? (
                    <div className="space-y-3">
                      {digest.map((item) => (
                        <div key={item.id} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-b-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {item.subject}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {item.from}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {new Date(item.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {item.priority && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} priority
                              </span>
                            )}
                            {item.category && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {item.category}
                              </span>
                            )}
                            {item.hasAiSuggestion && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white">
                                AI draft ready
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {item.snippet}
                            </p>
                            <Link
                              href={`https://mail.google.com/mail/u/0/#all/${item.gmailId}`}
                              target="_blank"
                              className="text-xs text-slate-900 font-medium ml-2 whitespace-nowrap"
                            >
                              Open
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No high‑impact emails detected for today.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Relationships & Communication */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-700" />
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Relationship Radar
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-slate-500">
                    People you&apos;re talking to the most
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {relationships.length > 0 ? (
                    <div className="space-y-3">
                      {relationships.slice(0, 10).map((rel) => (
                        <div key={rel.contact} className="flex items-center justify-between text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 truncate max-w-[180px]">
                              {rel.contact}
                            </span>
                            {rel.lastSubject && (
                              <span className="text-xs text-slate-500 truncate max-w-[220px]">
                                {rel.lastSubject}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {new Date(rel.lastInteractionAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-slate-500">{rel.totalEmails} emails</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      We&apos;ll populate your relationship map as emails arrive.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-slate-700" />
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Communication Coach
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-slate-500">
                    How you write and respond over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {communication ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Sent vs received
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {communication.totalSent} / {communication.totalReceived}
                        </p>
                        <p className="text-xs text-slate-500">
                          Emails you sent vs emails received (last 90 days)
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Typical response time
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {communication.medianResponseMinutes != null
                            ? `${communication.medianResponseMinutes} min`
                            : '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Median time to reply in a thread
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Average reply length
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {communication.avgReplyLengthWords} words
                        </p>
                        <p className="text-xs text-slate-500">
                          Good target is 60–120 words for clear replies
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          AI assist rate
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {Math.round((communication.aiReplyRate || 0) * 100)}%
                        </p>
                        <p className="text-xs text-slate-500">
                          Percent of replies generated with InboxPilot
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Start replying to emails and we&apos;ll analyze your style.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gmail Integration Status */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-700" />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Gmail Integration Status
                  </CardTitle>
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
                          setStats((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  userInfo: { ...prev.userInfo, extensionConnected: false },
                                }
                              : prev
                          );
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        fetchStats();
                      }}
                      title="Refresh connection status"
                    >
                      Refresh
                    </Button>
                  </div>
                )}
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
