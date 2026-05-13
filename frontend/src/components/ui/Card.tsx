import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', elevated = false, onClick }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white dark:bg-surface-800
          rounded-2xl border border-border-variant dark:border-white/10 
          ${elevated ? 'shadow-base' : 'shadow-xs'}
          ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => (
  <div
    className={`
      px-6 py-4 border-b border-border-variant dark:border-white/10 
      ${className}
    `}
  >
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent = ({ children, className = '' }: CardContentProps) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => (
  <div
    className={`
      px-6 py-4 border-t border-border-variant dark:border-white/10
      flex items-center justify-end gap-3
      ${className}
    `}
  >
    {children}
  </div>
);
