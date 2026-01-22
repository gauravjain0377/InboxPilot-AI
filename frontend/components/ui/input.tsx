import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50',
        // Override autofill styles
        'autofill:bg-white autofill:text-gray-900 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:[--webkit-text-fill-color:rgb(17,24,39)]',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
