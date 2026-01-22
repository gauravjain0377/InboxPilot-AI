'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info, Undo2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ message, type = 'info', duration = 4000, onClose, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        setTimeout(onClose, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (action) {
      action.onClick();
      handleClose();
    }
  };

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
      className={`fixed bottom-6 right-6 z-[200] flex flex-col overflow-hidden rounded-lg shadow-lg transition-all duration-300 ${
        styles[type]
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="shrink-0">{icons[type]}</div>
        <p className="text-sm font-medium flex-1">{message}</p>
        {action && (
          <button
            onClick={handleAction}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {action.label}
          </button>
        )}
        <button
          onClick={handleClose}
          className="shrink-0 hover:opacity-70 ml-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-white/20">
        <div 
          className="h-full bg-white/50 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
