'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ size = 'md', text, fullScreen = false }: LoaderProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', mail: 'h-4 w-4', text: 'text-xs' },
    md: { icon: 'w-12 h-12', mail: 'h-6 w-6', text: 'text-sm' },
    lg: { icon: 'w-16 h-16', mail: 'h-8 w-8', text: 'text-base' },
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
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
          className={`absolute inset-0 bg-neutral-900 rounded-xl`}
          animate={{ 
            scale: [1, 1.5, 1.5],
            opacity: [0.2, 0, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        {/* Main icon */}
        <div className={`relative ${sizes[size].icon} bg-neutral-900 rounded-xl flex items-center justify-center`}>
          <Mail className={`${sizes[size].mail} text-white`} />
        </div>
      </motion.div>

      {text && (
        <div className="flex items-center gap-1">
          <span className={`text-neutral-500 ${sizes[size].text}`}>{text}</span>
          <div className="flex gap-0.5 ml-0.5">
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
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Simple spinner variant
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`border-2 border-neutral-200 border-t-neutral-900 rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{ width: '1em', height: '1em' }}
    />
  );
}

// Dots loader variant
export function DotsLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-neutral-900 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
