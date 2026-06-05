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
            <div className="absolute left-3 text-text-tertiary">{leftIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-sm border bg-surface-50 dark:bg-surface-700
              px-4 py-2.5 text-sm text-ink dark:text-ink
              placeholder:text-text-tertiary dark:placeholder:text-text-tertiary
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-border-variant dark:border-white/10  focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || error ? 'pr-10' : ''}
              focus:outline-none
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
            <div className="absolute right-3 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
