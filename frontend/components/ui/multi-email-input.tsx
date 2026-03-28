'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MultiEmailInput({
  value,
  onChange,
  placeholder,
  className,
}: MultiEmailInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const emails = React.useMemo(() => {
    return value
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  }, [value]);

  const updateEmails = (newEmails: string[]) => {
    onChange(newEmails.join(', '));
  };

  const addEmails = (rawInput: string) => {
    const newEmails = rawInput
      .split(/[\s,]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    
    if (newEmails.length > 0) {
      const merged = Array.from(new Set([...emails, ...newEmails]));
      updateEmails(merged);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmails(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && emails.length > 0) {
      e.preventDefault();
      const newEmails = [...emails];
      newEmails.pop();
      updateEmails(newEmails);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    addEmails(pastedText);
  };

  const removeEmail = (emailToRemove: string) => {
    updateEmails(emails.filter((e) => e !== emailToRemove));
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 p-1 min-h-[36px] bg-transparent text-sm w-full',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {emails.map((email) => (
        <span
          key={email}
          className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md text-xs border border-gray-200"
        >
          {email}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeEmail(email);
            }}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) {
            addEmails(inputValue);
            setInputValue('');
          }
        }}
        placeholder={emails.length === 0 ? placeholder : ''}
        className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus:border-transparent min-w-[120px] text-sm text-gray-900 placeholder:text-gray-400 p-0 shadow-none h-6"
      />
    </div>
  );
}
