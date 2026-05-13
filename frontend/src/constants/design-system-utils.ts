/**
 * Design System Utilities & Common Patterns
 * Reusable utility classes, helper functions, and design patterns
 */

import { colors, borderRadius, spacing, shadows, typography } from './design-tokens';

/**
 * Color utilities - for dynamic color usage in components
 */
export const colorUtils = {
  getPrimaryColor: (shade: string = '600') => colors.primary[shade as keyof typeof colors.primary],
  getSecondarColor: (shade: string = '600') => colors.secondary[shade as keyof typeof colors.secondary],
  getStatusColor: (status: 'success' | 'error' | 'warning' | 'info') => {
    const statusColors = {
      success: '#28a745',
      error: '#ba1a1a',
      warning: '#ffc107',
      info: '#17a2b8',
    };
    return statusColors[status];
  },
  getSurfaceColor: (level: 'base' | 'container-lowest' | 'container-low' | 'container-high') => {
    const surfaceMap = {
      'base': colors.surface.background,
      'container-lowest': colors.surface.container.lowest,
      'container-low': colors.surface.container.low,
      'container-high': colors.surface.container.high,
    };
    return surfaceMap[level];
  },
};

/**
 * Commonly used Tailwind class combinations
 */
export const commonClasses = {
  // Surfaces
  cardBase: 'bg-white dark:bg-surface-50 rounded-2xl border border-border-variant dark:border-white/10 shadow-xs',
  cardElevated: 'bg-white dark:bg-surface-50 rounded-2xl border border-border-variant dark:border-white/10 shadow-base',
  cardInteractive: 'bg-white dark:bg-surface-50 rounded-2xl border border-border-variant dark:border-white/10 shadow-xs hover:shadow-md transition-shadow cursor-pointer',

  // Buttons
  buttonPrimary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-colors',
  buttonSecondary: 'bg-surface-100 dark:bg-surface-200 text-ink hover:bg-surface-200 dark:hover:bg-surface-300 transition-colors',
  buttonOutline: 'border border-border-variant bg-white dark:bg-surface-50 text-ink hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors',
  buttonGhost: 'text-ink-muted hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors',

  // Text
  textHeadlineXl: 'text-3xl font-display font-bold tracking-tight',
  textHeadlineLg: 'text-2xl font-display font-semibold',
  textHeadlineMd: 'text-lg font-display font-semibold',
  textBodyLg: 'text-base leading-relaxed',
  textBodyMd: 'text-sm leading-normal',
  textLabel: 'text-xs font-medium uppercase tracking-wide',
  textMuted: 'text-text-secondary dark:text-ink-muted',

  // Layouts
  containerMaxWidth: 'max-w-7xl mx-auto',
  pageLayout: 'flex min-h-screen bg-surface-background dark:bg-surface-900 text-text-primary dark:text-ink',

  // Forms
  inputBase: 'w-full rounded-md border bg-surface-50 dark:bg-surface-200 px-3 py-2 text-sm text-ink placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
  
  // Utilities
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary-500/40',
  transitionSmooth: 'transition-all duration-200 ease-out',
  noScrollbar: 'scrollbar-hide -webkit-scrollbar-hide',
};

/**
 * Responsive utilities
 */
export const responsiveUtils = {
  mobileOnly: 'md:hidden',
  desktopOnly: 'hidden md:flex',
  tabletUp: 'md:flex',
  desktopUp: 'lg:block',
};

/**
 * Spacing utility helpers
 */
export const spacingUtils = {
  containerPadding: 'px-4 md:px-6 lg:px-8',
  stackSmall: 'space-y-2',
  stackMedium: 'space-y-4',
  stackLarge: 'space-y-6',
  gapSmall: 'gap-2',
  gapMedium: 'gap-4',
  gapLarge: 'gap-6',
};

/**
 * Shadow utilities
 */
export const shadowUtils = {
  subtle: `shadow-xs`,
  standard: `shadow-base`,
  elevated: `shadow-lg`,
  maximum: `shadow-xl`,
};

/**
 * Border radius utilities
 */
export const borderRadiusUtils = {
  button: borderRadius.button,
  card: borderRadius.card,
  input: borderRadius.input,
  avatar: borderRadius.avatar,
  chip: borderRadius.chip,
};

/**
 * Animation utilities
 */
export const animationUtils = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  bounce: 'animate-bounce',
};

/**
 * Z-index utility
 */
export const zIndexUtils = {
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modal: 'z-40',
  toast: 'z-50',
  popover: 'z-40',
};

/**
 * Common component patterns
 */
export const patterns = {
  /**
   * Empty state pattern
   */
  emptyState: (message: string, icon?: React.ReactNode) => ({
    className: 'text-center py-12 bg-surface-100 dark:bg-surface-200 rounded-2xl border border-border-variant border-dashed',
    render: (
      <div className="flex flex-col items-center gap-3">
        {icon && <div className="text-4xl opacity-50">{icon}</div>}
        <p className="text-text-secondary dark:text-ink-muted">{message}</p>
      </div>
    ),
  }),

  /**
   * Loading skeleton pattern for lists
   */
  skeletonList: (count: number = 3) =>
    Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-surface-200 dark:bg-surface-300 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-200 dark:bg-surface-300 rounded w-3/4" />
            <div className="h-3 bg-surface-200 dark:bg-surface-300 rounded w-1/2" />
          </div>
        </div>
      </div>
    )),

  /**
   * Error state pattern
   */
  errorState: (error: string | Error) => ({
    className: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4',
    render: (
      <div className="text-red-700 dark:text-red-300">
        <p className="font-semibold">Error occurred</p>
        <p className="text-sm mt-1">{typeof error === 'string' ? error : error.message}</p>
      </div>
    ),
  }),
};