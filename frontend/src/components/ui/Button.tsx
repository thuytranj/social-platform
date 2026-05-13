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
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 shadow-xs hover:shadow-sm',
      secondary:
        'bg-surface-100 dark:bg-surface-200 text-ink hover:bg-surface-200 dark:hover:bg-surface-300',
      outline:
        'border border-border-base bg-white dark:bg-surface-50 text-ink hover:bg-surface-100 dark:hover:bg-surface-200',
      ghost: 'text-ink-muted hover:bg-surface-100 dark:hover:bg-surface-700',
      danger:
        'bg-red-600 text-white hover:bg-red-700 shadow-xs hover:shadow-sm',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-sm rounded-md',
      md: 'h-10 px-5 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-md',
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
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
