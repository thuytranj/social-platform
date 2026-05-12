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
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-surface-50 border border-gray-200 dark:border-white/10 rounded-[28px] shadow-[0_18px_60px_rgba(15,23,42,0.14)] animate-scale-in flex flex-col max-h-[calc(100vh-2rem)]`}
      >
        {/* Header */}
        {(title || !!onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
            {title && (
              <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-ink">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="ml-auto text-gray-500 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink transition-colors rounded-full p-2 hover:bg-gray-100 dark:hover:bg-surface-200"
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
