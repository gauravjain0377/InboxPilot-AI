'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser, setToken } = useUserStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/url');
      window.location.href = data.url;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  }, []);

  const handleAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/google', { code });
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Auth callback error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">InboxPilot AI</CardTitle>
          <CardDescription>AI-Powered Executive Email Assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Connecting...' : 'Sign in with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

