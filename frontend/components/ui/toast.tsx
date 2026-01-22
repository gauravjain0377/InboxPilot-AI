'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check className="h-4 w-4" />,
    error: <X className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  const styles = {
    success: 'bg-gray-900 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-gray-800 text-white',
    info: 'bg-gray-900 text-white',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        styles[type]
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 shrink-0 hover:opacity-70"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast container for multiple toasts
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
