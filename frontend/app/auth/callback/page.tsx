'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Wrap the actual callback component in Suspense so Next.js
// doesn't try to prerender it without browser APIs like useSearchParams.
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-slate-200 bg-white shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Completing Authentication
              </CardTitle>
              <CardDescription className="text-slate-600">
                Setting up your account...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
              <Loader2 className="h-12 w-12 text-slate-700 animate-spin" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
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
      return;
    }

    if (token && email) {
      // Store token
      setToken(token);
      
      // Try to fetch user info from backend
      api.get('/analytics/dashboard')
        .then((response) => {
          const userInfo = response.data.stats?.userInfo;
          if (userInfo) {
            setUser({
              id: '',
              email: userInfo.email || decodeURIComponent(email),
              name: userInfo.name || '',
              picture: userInfo.picture,
            });
          } else {
            // Fallback to email only
            setUser({
              id: '',
              email: decodeURIComponent(email),
              name: '',
            });
          }
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1500);
        })
        .catch((err) => {
          console.error('Error fetching user info:', err);
          // Still set user with email and redirect
          setUser({
            id: '',
            email: decodeURIComponent(email),
            name: '',
          });
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1500);
        });
    } else {
      setStatus('error');
      setError('Missing authentication token. Please try logging in again.');
    }
  }, [searchParams, setToken, setUser, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-slate-200 bg-white shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            {status === 'loading' && 'Completing Authentication'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {status === 'loading' && 'Setting up your account...'}
            {status === 'success' && 'Redirecting to your dashboard...'}
            {status === 'error' && error}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 text-slate-700 animate-spin" />
          )}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-slate-900" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                You will be redirected shortly...
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <Link href="/login">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  Try Again
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
