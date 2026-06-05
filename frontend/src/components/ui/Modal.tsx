import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[calc(100%-2rem)]',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-surface-900 border border-border-variant dark:border-white/10   rounded-2xl shadow-lg animate-scale-in flex flex-col max-h-[calc(100vh-2rem)]`}
      >
        {/* Header */}
        {(title || !!onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-variant dark:border-white/10  shrink-0">
            {title && (
              <h3 className="text-lg font-display font-semibold text-text-primary dark:text-ink">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="ml-auto text-text-tertiary dark:text-ink-muted hover:text-text-primary dark:hover:text-ink transition-colors rounded-full p-2 hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
