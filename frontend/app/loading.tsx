'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-sans">
      <div className="text-center">
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
          <h2 className="text-lg font-semibold text-neutral-900 mb-2 font-display tracking-tight">
            InboxPilot AI
          </h2>
          
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
          className="mt-8 w-48 mx-auto"
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
      </div>
    </div>
  );
}
