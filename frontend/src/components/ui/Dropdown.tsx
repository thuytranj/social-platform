import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownProps {
  trigger?: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const Dropdown = ({
  trigger,
  items,
  align = 'right',
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <button className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-200 text-text-secondary dark:text-ink-muted hover:text-text-primary dark:hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40">
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 rounded-md bg-white dark:bg-surface-50 border border-border-variant dark:border-white/10  shadow-lg py-1 animate-scale-in origin-top-${align} ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                  : 'text-text-primary dark:text-ink hover:bg-surface-100 dark:hover:bg-surface-200'
              }`}
            >
              {item.icon && (
                <span
                  className={
                    item.danger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-text-secondary dark:text-ink-muted'
                  }
                >
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
