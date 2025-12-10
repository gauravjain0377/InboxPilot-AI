'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Star, Clock } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Inbox</h1>
          <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <Card key={email._id} className={!email.isRead ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {email.isStarred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        {email.subject || '(No Subject)'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{email.from}</p>
                      <p className="text-sm mt-2">{email.snippet}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        email.priority === 'high' ? 'bg-red-100 text-red-800' :
                        email.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {email.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
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

