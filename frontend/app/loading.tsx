'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Inbox } from 'lucide-react';

export default function Loading() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReload(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-sans px-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
            backgroundSize: '34px 34px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-600"
        >
          <Inbox className="h-3.5 w-3.5 text-blue-600" />
          Preparing your smart inbox
        </motion.div>

        <div className="bg-white/90 border border-neutral-200 rounded-3xl p-8 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.25)]">
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-6"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 bg-neutral-900 rounded-2xl"
              animate={{ 
                scale: [1, 1.4, 1.4],
                opacity: [0.3, 0, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            {/* Main icon */}
            <div className="relative w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </motion.div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-1 font-display tracking-tight">
            InboxPilot AI
          </h2>
          <p className="text-sm text-neutral-500 mb-3">Syncing your inbox workspace</p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-neutral-500 text-sm">Loading</span>
            <div className="flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 bg-neutral-400 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full max-w-[240px] mx-auto"
        >
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-neutral-900 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showReload ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {showReload && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500">Still loading? Refresh your inbox session.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Inbox
              </button>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}
