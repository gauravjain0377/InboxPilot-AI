'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useUserStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Authentication failed. Please try again.');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (token && email) {
      // Store token and user info
      setToken(token);
      setUser({
        id: '',
        email: decodeURIComponent(email),
        name: '',
      });

      // Fetch full user info
      api.get('/gmail/messages?maxResults=1')
        .then(() => {
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1500);
        })
        .catch((err) => {
          console.error('Error fetching user info:', err);
          setStatus('success'); // Still redirect, token is valid
          setTimeout(() => router.push('/dashboard'), 1500);
        });
    } else {
      setStatus('error');
      setError('Missing authentication token. Please try logging in again.');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, setToken, setUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Completing Authentication</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Setting up your account...'}
            {status === 'success' && 'Success! Redirecting to dashboard...'}
            {status === 'error' && error}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          )}
          {status === 'success' && (
            <div className="text-green-500 text-4xl">✓</div>
          )}
          {status === 'error' && (
            <div className="text-red-500 text-4xl">✗</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

