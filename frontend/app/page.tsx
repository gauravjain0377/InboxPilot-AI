'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Sparkles, Clock, TrendingUp, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">InboxPilot AI</h1>
          </div>
          <Link href="/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI-Powered Executive Email Assistant
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transform your Gmail inbox with intelligent automation. Get AI-powered replies, 
          smart prioritization, and seamless integration directly in your email.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Powerful Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <CardTitle>AI-Powered Replies</CardTitle>
              <CardDescription>
                Generate intelligent email replies with perfect tone - formal, friendly, or assertive
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Smart Prioritization</CardTitle>
              <CardDescription>
                Automatically categorize and prioritize emails based on importance and urgency
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Follow-up Automation</CardTitle>
              <CardDescription>
                Never miss important emails with intelligent follow-up reminders and tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Gmail Integration</CardTitle>
              <CardDescription>
                Works seamlessly inside your Gmail inbox with Chrome extension and Gmail add-on
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Email Summarization</CardTitle>
              <CardDescription>
                Get instant summaries of long email threads to save time and stay informed
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is encrypted and secure. We only access what you authorize
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-white rounded-2xl my-20">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h4 className="font-semibold text-lg mb-2">Connect Your Gmail</h4>
            <p className="text-gray-600">
              Grant secure access to your Gmail account with OAuth. Your credentials are encrypted.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h4 className="font-semibold text-lg mb-2">Install Extension</h4>
            <p className="text-gray-600">
              Add the Chrome extension or Gmail add-on to get AI features directly in your inbox.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h4 className="font-semibold text-lg mb-2">Start Using AI</h4>
            <p className="text-gray-600">
              Get AI replies, smart labels, priority detection, and more - all in your Gmail.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-3xl mb-4">Ready to Transform Your Email?</CardTitle>
            <CardDescription className="text-indigo-100">
              Join thousands of professionals who save hours every week with InboxPilot AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 InboxPilot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
