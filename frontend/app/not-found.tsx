'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Home, ArrowLeft, Search } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { ContactModal } from '@/components/ui/contact-modal';

export default function NotFound() {
  const { user } = useUserStore();
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900 font-display tracking-tight">InboxPilot AI</span>
          </Link>
        </motion.div>

        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="mb-8"
        >
          <h1 className="text-[150px] md:text-[200px] font-bold text-neutral-100 leading-none font-display select-none">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 -mt-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full mb-4">
            <Search className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600 font-medium">Page not found</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3 font-display tracking-tight">
            Oops! Lost in the inbox
          </h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={user ? '/dashboard' : '/'}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              <Home className="w-5 h-5" />
              {user ? 'Go to Dashboard' : 'Go to Home'}
            </motion.button>
          </Link>

          <motion.button
            onClick={() => window.history.back()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-4 bg-neutral-100 text-neutral-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </motion.button>
        </motion.div>

        {/* Help Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-sm text-neutral-400"
        >
          Need help?{' '}
          <button 
            onClick={() => setShowContactModal(true)}
            className="text-neutral-600 hover:text-neutral-900 underline"
          >
            Contact Support
          </button>
        </motion.p>
      </div>

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
}
