import React, { ReactNode, useState } from 'react';

interface TabItem {
  label: string;
  value: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  children?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const Tabs = ({
  tabs,
  defaultValue,
  onChange,
  children,
  fullWidth = false,
  className = '',
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(
    defaultValue || tabs[0]?.value || '',
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onChange?.(value);
  };

  return (
    <div className={className}>
      <div
        className={`flex gap-6 border-t border-border-variant dark:border-white/10  overflow-x-auto ${
          fullWidth ? 'gap-0' : 'gap-6'
        } no-scrollbar`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`
              py-3 px-1 text-sm font-medium whitespace-nowrap transition-colors
              border-b-2 flex items-center gap-2
              ${
                activeTab === tab.value
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-secondary dark:text-ink-muted hover:text-text-primary dark:hover:text-ink'
              }
              ${fullWidth ? 'flex-1 justify-center' : ''}
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
};

interface TabContentProps {
  value: string;
  activeTab?: string;
  children: ReactNode;
}

export const TabContent = ({ value, activeTab, children }: TabContentProps) => {
  if (value !== activeTab) return null;
  return <div>{children}</div>;
};
