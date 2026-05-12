import React, { InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className = '', label, error, leftIcon, rightIcon, id, ...props },
    ref,
  ) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-muted ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-gray-400 dark:text-ink-faint">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-2xl border bg-gray-50 dark:bg-surface-200
              px-4 py-2.5 text-sm text-gray-900 dark:text-ink
              placeholder:text-gray-400 dark:placeholder:text-ink-faint
              focus:outline-none focus:ring-2 transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:ring-primary-500/20 focus:border-primary-500'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || error ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {error && !rightIcon && (
            <div className="absolute right-3 text-red-500">
              <AlertCircle size={18} />
            </div>
          )}
          {rightIcon && (
            <div className="absolute right-3 text-ink-faint">{rightIcon}</div>
          )}
        </div>
        {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
