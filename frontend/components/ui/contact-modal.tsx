'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Linkedin, ExternalLink, Copy, Check } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [copied, setCopied] = useState(false);
  const email = 'gjain0229@gmail.com';
  const linkedinUrl = 'https://www.linkedin.com/in/this-is-gaurav-jain/';
  
  // Gmail compose URL - opens Gmail in browser with email pre-filled
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container - Centers the modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-900">Contact Us</h2>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <X className="w-5 h-5 text-neutral-500" />
                    </button>
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">
                    We'd love to hear from you!
                  </p>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  {/* Email Option */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm">Email</p>
                        <p className="text-xs text-neutral-500 truncate">{email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Opens Gmail compose in new tab */}
                      <a
                        href={gmailComposeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Open Gmail
                      </a>
                      <button
                        onClick={copyEmail}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
                        title="Copy email"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* LinkedIn Option */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Linkedin className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm">LinkedIn</p>
                        <p className="text-xs text-neutral-500">Connect with us</p>
                      </div>
                    </div>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      Open LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
                  <p className="text-xs text-neutral-400 text-center">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
