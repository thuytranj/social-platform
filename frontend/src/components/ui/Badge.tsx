import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className = '' }, ref) => {
    const variantClasses = {
      default:
        'bg-surface-100 dark:bg-surface-200 text-text-primary dark:text-ink',
      primary:
        'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
      secondary:
        'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300',
      success:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      warning:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs font-semibold rounded-sm',
      md: 'px-2.5 py-1 text-sm font-medium rounded-md',
      lg: 'px-3 py-1.5 text-base font-semibold rounded-lg',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center justify-center
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

/**
 * Chip - Smaller, inline badge variant (for tags, categories, etc.)
 */
interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ children, onRemove, variant = 'default', className = '' }, ref) => {
    const variantClasses = {
      default:
        'bg-surface-200 dark:bg-surface-300 text-text-primary dark:text-ink',
      primary:
        'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
      secondary:
        'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300',
    };

    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5
          text-sm font-medium
          rounded-full
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {children}
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-1 text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Remove chip"
          >
            ×
          </button>
        )}
      </div>
    );
  },
);

Chip.displayName = 'Chip';
