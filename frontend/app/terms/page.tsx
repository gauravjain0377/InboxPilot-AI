'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-neutral-900 font-display tracking-tight">InboxPilot AI</span>
            </Link>
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
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-neutral-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 font-display">Terms of Service</h1>
              <p className="text-neutral-500 text-sm">Last updated: January 22, 2026</p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-neutral-600 leading-relaxed">
                By accessing or using InboxPilot AI ("Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Description of Service</h2>
              <p className="text-neutral-600 leading-relaxed">
                InboxPilot AI is an AI-powered email management service that helps users organize, prioritize, 
                and respond to emails more efficiently. The Service integrates with Google Gmail through 
                authorized OAuth 2.0 authentication.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Account Registration</h2>
              <p className="text-neutral-600 leading-relaxed mb-3">To use the Service, you must:</p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Have a valid Google account</li>
                <li>Authorize InboxPilot AI to access your Gmail account</li>
                <li>Provide accurate and complete information</li>
                <li>Be at least 13 years of age</li>
              </ul>
              <p className="text-neutral-600 leading-relaxed mt-3">
                You are responsible for maintaining the confidentiality of your account and for all activities 
                that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Acceptable Use</h2>
              <p className="text-neutral-600 leading-relaxed mb-3">You agree NOT to use the Service to:</p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Send spam, phishing, or malicious content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Reverse engineer or decompile any part of the Service</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Intellectual Property</h2>
              <p className="text-neutral-600 leading-relaxed">
                The Service and its original content, features, and functionality are owned by InboxPilot AI 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws. You may not copy, modify, distribute, sell, or lease any part 
                of our Service without explicit written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. User Content</h2>
              <p className="text-neutral-600 leading-relaxed">
                You retain ownership of your email content. By using the Service, you grant us a limited, 
                non-exclusive license to access and process your emails solely for the purpose of providing 
                the Service. We do not claim ownership of your content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. AI-Generated Suggestions</h2>
              <p className="text-neutral-600 leading-relaxed">
                The Service provides AI-generated email suggestions and responses. These are provided as 
                recommendations only. You are solely responsible for reviewing, editing, and sending any 
                emails. We do not guarantee the accuracy, appropriateness, or effectiveness of AI-generated content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Third-Party Services</h2>
              <p className="text-neutral-600 leading-relaxed">
                The Service integrates with Google Gmail. Your use of Google services is subject to 
                Google's Terms of Service and Privacy Policy. We are not responsible for the practices 
                of third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Service Availability</h2>
              <p className="text-neutral-600 leading-relaxed">
                We strive to maintain high availability but do not guarantee uninterrupted access to the Service. 
                We may modify, suspend, or discontinue the Service at any time without notice. We are not liable 
                for any modification, suspension, or discontinuation of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Disclaimer of Warranties</h2>
              <p className="text-neutral-600 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE 
                WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">11. Limitation of Liability</h2>
              <p className="text-neutral-600 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, INBOXPILOT AI SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, 
                OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">12. Indemnification</h2>
              <p className="text-neutral-600 leading-relaxed">
                You agree to indemnify and hold harmless InboxPilot AI and its officers, directors, employees, 
                and agents from any claims, damages, losses, liabilities, and expenses arising from your use 
                of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">13. Termination</h2>
              <p className="text-neutral-600 leading-relaxed">
                We may terminate or suspend your access to the Service immediately, without prior notice, 
                for any reason, including breach of these Terms. You may terminate your account at any time 
                by revoking access through your Google account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">14. Changes to Terms</h2>
              <p className="text-neutral-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material 
                changes by posting the new Terms on this page. Your continued use of the Service after changes 
                constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">15. Governing Law</h2>
              <p className="text-neutral-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">16. Contact Us</h2>
              <p className="text-neutral-600 leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-none mt-3 text-neutral-600 space-y-1">
                <li><strong>Email:</strong> <a href="mailto:gjain0229@gmail.com" className="text-blue-600 hover:underline">gjain0229@gmail.com</a></li>
                <li><strong>Website:</strong> <a href="https://inboxpilot-ai.vercel.app" className="text-blue-600 hover:underline">https://inboxpilot-ai.vercel.app</a></li>
              </ul>
            </section>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} InboxPilot AI. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
