'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmVariant?: 'default' | 'destructive';
  loading?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  confirmVariant = 'default',
  loading = false,
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {description && (
            <p className="text-sm text-gray-600 mb-4">{description}</p>
          )}
          {children}
        </div>

        {/* Footer */}
        {(confirmText || cancelText) && (
          <div className="flex justify-end gap-3 px-5 pb-5">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-200"
            >
              {cancelText}
            </Button>
            {confirmText && onConfirm && (
              <Button
                onClick={onConfirm}
                disabled={loading}
                className={
                  confirmVariant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }
              >
                {loading ? 'Please wait...' : confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple confirmation dialog
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      confirmVariant={variant}
      loading={loading}
    />
  );
}
