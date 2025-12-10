'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Star, Clock, ArrowLeft, Filter } from 'lucide-react';

interface Email {
  _id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  priority: string;
}

export default function InboxPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchEmails();
  }, [user, router]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gmail/messages?maxResults=50');
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-slate-900">Inbox</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-300">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={fetchEmails} className="border-slate-300">
              Refresh
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        ) : emails.length === 0 ? (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No emails found</h3>
              <p className="text-slate-500 mb-4">Your inbox is empty or emails haven't been synced yet.</p>
              <Button onClick={fetchEmails} variant="outline" className="border-slate-300">
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <Card 
                key={email._id} 
                className={`border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow ${
                  !email.isRead ? 'border-l-4 border-l-slate-900 bg-slate-50' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 mb-2">
                        {email.isStarred && (
                          <Star className="h-4 w-4 fill-slate-400 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="truncate font-semibold text-slate-900">{email.subject || '(No Subject)'}</span>
                      </CardTitle>
                      <p className="text-sm font-medium text-slate-700 mb-1">{email.from}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{email.snippet}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(email.priority)}`}>
                        {email.priority}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
