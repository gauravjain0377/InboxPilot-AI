'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 font-display">Privacy Policy</h1>
              <p className="text-neutral-500 text-sm">Last updated: January 22, 2026</p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Introduction</h2>
              <p className="text-neutral-600 leading-relaxed">
                Welcome to InboxPilot AI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our AI-powered email management service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">2.1 Information from Google Account</h3>
              <p className="text-neutral-600 leading-relaxed mb-3">
                When you sign in with Google, we access the following information with your explicit consent:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Your Google account email address and profile information</li>
                <li>Email messages and metadata (subject, sender, recipient, date)</li>
                <li>Email labels and folder organization</li>
              </ul>

              <h3 className="text-lg font-medium text-neutral-800 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (features used, interaction patterns)</li>
                <li>Log data (IP address, access times)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-neutral-600 leading-relaxed mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Provide AI-powered email analysis and smart reply suggestions</li>
                <li>Prioritize and categorize your emails intelligently</li>
                <li>Improve and personalize your experience</li>
                <li>Maintain and secure our services</li>
                <li>Communicate with you about service updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Data Storage and Security</h2>
              <p className="text-neutral-600 leading-relaxed">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2 mt-3">
                <li>All data is encrypted in transit using TLS/SSL</li>
                <li>Data at rest is encrypted using AES-256 encryption</li>
                <li>We use secure OAuth 2.0 for Google authentication</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access to user data is strictly limited to essential personnel</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Data Sharing and Disclosure</h2>
              <p className="text-neutral-600 leading-relaxed">
                We do NOT sell, trade, or rent your personal information to third parties. We may share information only in these circumstances:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2 mt-3">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in operating our service (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Google API Services User Data Policy</h2>
              <p className="text-neutral-600 leading-relaxed">
                InboxPilot AI's use and transfer of information received from Google APIs adheres to the{' '}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Your Rights and Choices</h2>
              <p className="text-neutral-600 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Access and download your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Revoke Google access permissions at any time</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
              <p className="text-neutral-600 leading-relaxed mt-3">
                To exercise these rights, please contact us at <a href="mailto:gjain0229@gmail.com" className="text-blue-600 hover:underline">gjain0229@gmail.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Data Retention</h2>
              <p className="text-neutral-600 leading-relaxed">
                We retain your data only as long as necessary to provide our services. When you delete your account, 
                we will delete your personal data within 30 days, except where retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Children's Privacy</h2>
              <p className="text-neutral-600 leading-relaxed">
                InboxPilot AI is not intended for users under 13 years of age. We do not knowingly collect 
                personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Changes to This Policy</h2>
              <p className="text-neutral-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">11. Contact Us</h2>
              <p className="text-neutral-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us:
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
