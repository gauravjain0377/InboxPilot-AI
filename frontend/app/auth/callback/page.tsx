'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="relative w-16 h-16">
    <motion.div
      className="absolute inset-0 border-4 border-neutral-200 rounded-full"
    />
    <motion.div
      className="absolute inset-0 border-4 border-transparent border-t-neutral-900 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// Wrap the actual callback component in Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthLoadingState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl p-10 shadow-xl shadow-neutral-200/50 border border-neutral-100 text-center">
          <div className="flex justify-center mb-6">
            <LoadingSpinner />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2 font-display tracking-tight">
            Completing Authentication
          </h2>
          <p className="text-neutral-500 text-sm">
            Setting up your account...
          </p>
        </div>
      </motion.div>
    </div>
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
      setToken(token);
      
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl p-10 shadow-xl shadow-neutral-200/50 border border-neutral-100 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'loading' && <LoadingSpinner />}
            
            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </motion.div>
              </motion.div>
            )}
            
            {status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
              >
                <XCircle className="h-8 w-8 text-red-600" />
              </motion.div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-neutral-900 mb-2 font-display tracking-tight">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>

          {/* Description */}
          <p className="text-neutral-500 text-sm mb-6">
            {status === 'loading' && 'Setting up your account...'}
            {status === 'success' && 'Redirecting to your dashboard...'}
            {status === 'error' && error}
          </p>

          {/* Progress bar for success */}
          {status === 'success' && (
            <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "linear" }}
              />
            </div>
          )}

          {/* Error action */}
          {status === 'error' && (
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-12 rounded-xl font-medium transition-colors"
              >
                Try Again
              </motion.button>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
