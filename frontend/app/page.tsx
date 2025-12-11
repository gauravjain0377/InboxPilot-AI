'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Sparkles, Clock, TrendingUp, Zap, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">InboxPilot AI</h1>
          </div>
          <Link href="/login">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
          AI-Powered Executive Email Assistant
        </h2>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Transform your Gmail inbox with intelligent automation. Get AI-powered replies, 
          smart prioritization, and seamless integration directly in your email.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 bg-white">
              Watch Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features - Black & White Theme */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-4 text-slate-900">Powerful Features</h3>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
          Everything you need to manage your inbox efficiently
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* AI-Powered Replies */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <Card className="relative border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-100 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-xl mb-2">AI-Powered Replies</CardTitle>
                  <CardDescription className="text-slate-600">
                    Generate intelligent email replies with perfect tone - formal, friendly, or assertive
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Smart Prioritization */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <Card className="relative border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-100 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-xl mb-2">Smart Prioritization</CardTitle>
                  <CardDescription className="text-slate-600">
                    Automatically categorize and prioritize emails based on importance and urgency
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Follow-up Automation */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <Card className="relative border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-100 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-xl mb-2">Follow-up Automation</CardTitle>
                  <CardDescription className="text-slate-600">
                    Never miss important emails with intelligent follow-up reminders and tracking
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Gmail Integration */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <Card className="relative border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-100 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-xl mb-2">Gmail Integration</CardTitle>
                  <CardDescription className="text-slate-600">
                    Works seamlessly inside your Gmail inbox with Chrome extension and Gmail add-on
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Email Summarization */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <Card className="relative border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-100 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-xl mb-2">Email Summarization</CardTitle>
                  <CardDescription className="text-slate-600">
                    Get instant summaries of long email threads to save time and stay informed
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Secure & Private */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <Card className="relative border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-100 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-xl mb-2">Secure & Private</CardTitle>
                  <CardDescription className="text-slate-600">
                    Your data is encrypted and secure. We only access what you authorize
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
          <h3 className="text-3xl font-bold text-center mb-4 text-slate-900">How It Works</h3>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Get started in minutes with our simple setup process
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-slate-900">Connect Your Gmail</h4>
              <p className="text-slate-600">
                Grant secure access to your Gmail account with OAuth. Your credentials are encrypted.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-slate-900">Install Extension</h4>
              <p className="text-slate-600">
                Add the Chrome extension or Gmail add-on to get AI features directly in your inbox.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-slate-900">Start Using AI</h4>
              <p className="text-slate-600">
                Get AI replies, smart labels, priority detection, and more - all in your Gmail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto bg-slate-900 text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4 text-white">Ready to Transform Your Email?</CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              Join thousands of professionals who save hours every week with InboxPilot AI
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2024 InboxPilot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
