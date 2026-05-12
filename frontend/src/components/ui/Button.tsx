import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm shadow-primary-500/20',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-surface-200 dark:text-ink dark:hover:bg-surface-300',
      outline: 'border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-50 text-gray-700 dark:text-ink hover:bg-gray-50 dark:hover:bg-surface-200',
      ghost: 'text-gray-700 dark:text-ink-muted hover:bg-gray-100 dark:hover:bg-surface-200',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
