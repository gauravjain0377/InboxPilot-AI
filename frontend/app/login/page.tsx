'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import { Mail, ArrowRight, Shield, Zap, CheckCircle2, ArrowLeft, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      try {
        await fetch(`${apiUrl.replace('/api', '')}/health`, {
          method: 'GET',
          mode: 'cors',
        }).catch(() => {});
      } catch (healthError) {}
      
      const { data } = await api.get('/auth/url', {
        timeout: 10000,
      });
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to connect to server. ';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage += 'Please make sure the backend server is running.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage += 'Connection refused. Is the backend server running?';
      } else if (error.response) {
        errorMessage = error.response.data?.message || error.message || 'Authentication failed';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      let errorMessage = 'Authentication failed. ';
      
      switch (errorParam) {
        case 'db_error':
          errorMessage += 'Database connection error.';
          break;
        case 'token_error':
          errorMessage += 'OAuth token error. Please try again.';
          break;
        case 'config_error':
          errorMessage += 'Configuration error.';
          break;
        case 'no_code':
          errorMessage += 'No authorization code received.';
          break;
        case 'auth_failed':
          errorMessage += 'Please try again.';
          break;
        default:
          errorMessage += 'Please try again.';
      }
      
      setError(errorMessage);
    }
  }, []);

  const features = [
    { icon: Zap, text: 'AI-powered smart replies', desc: 'Generate perfect responses instantly' },
    { icon: CheckCircle2, text: 'Intelligent prioritization', desc: 'Focus on what matters most' },
    { icon: Shield, text: 'Bank-grade security', desc: 'Your data is always protected' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-[45%] bg-neutral-900 text-white p-10 flex-col relative overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent" />
          
          {/* Animated Circles */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center">
                <Mail className="h-5 w-5 text-neutral-900" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight">InboxPilot AI</span>
            </Link>
            
            {/* Main Content - Centered */}
            <div className="flex-1 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 font-medium">AI-Powered Email Assistant</span>
                </div>
                
                <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 font-display tracking-tight">
                  Transform Your
                  <br />
                  <span className="text-blue-400">Email Experience</span>
                </h1>
                <p className="text-neutral-400 leading-relaxed max-w-sm mb-8">
                  Join thousands of professionals saving hours every week with intelligent email management.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {features.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <item.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.text}</p>
                      <p className="text-neutral-500 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Bottom Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-8 pt-8 border-t border-neutral-800"
            >
              <div>
                <p className="text-2xl font-bold text-white font-display">10K+</p>
                <p className="text-neutral-500 text-sm">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-display">5M+</p>
                <p className="text-neutral-500 text-sm">Emails Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-display">4.9</p>
                <p className="text-neutral-500 text-sm">User Rating</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-neutral-900 font-display tracking-tight">InboxPilot AI</span>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-neutral-200/50 border border-neutral-100">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2 font-display tracking-tight">
                  Welcome back
                </h2>
                <p className="text-neutral-500">
                  Sign in to continue to your inbox
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Google Sign In Button */}
              <motion.button
                onClick={handleGoogleLogin}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 h-14 rounded-xl font-medium text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    {/* Google Icon */}
                    <Image 
                      src="/google.jpg" 
                      alt="Google" 
                      width={20}
                      height={20}
                      className="object-contain"
                      priority
                      unoptimized
                    />
                    <span className="font-semibold">Continue with Google</span>
                  </>
                )}
              </motion.button>

              {/* Alternative: Email Sign In (disabled/coming soon) */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-400">or</span>
                </div>
              </div>

              <button
                disabled
                className="w-full bg-neutral-100 text-neutral-400 h-14 rounded-xl font-medium text-base flex items-center justify-center gap-3 cursor-not-allowed"
              >
                <Mail className="w-5 h-5" />
                <span>Email sign-in coming soon</span>
              </button>

              {/* Terms Agreement */}
              <div className="mt-6 text-center">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  By signing in, you agree to our{' '}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>

              {/* Security Note */}
              <div className="mt-4 flex items-center justify-center gap-2 text-neutral-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Secure sign-in with Google OAuth 2.0</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
