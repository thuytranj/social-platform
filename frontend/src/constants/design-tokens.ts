/**
 * Design Tokens — Stitch "Premium Minimalist Social" System
 * Reference: Nexus Social Platform Design System
 */

// ============================================================
// COLOR PALETTE
// ============================================================

export const colors = {
  // Primary Blue (Brand color)
  primary: {
    50: '#f0f7ff',
    100: '#e0effe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Light blue for UI
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
    // Semantic overrides for Stitch
    DEFAULT: '#1877f2', // Facebook Blue (override)
    accent: '#0058bc', // Stitch primary
    container: '#0070eb',
  },

  // Secondary (Slate/Grey)
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Base secondary
    600: '#54606a', // Stitch secondary
    700: '#475569',
    800: '#1e293b',
  },

  // Tertiary (Charcoal)
  tertiary: {
    500: '#595c5f', // Stitch tertiary
    600: '#505358',
    700: '#474a4d',
  },

  // Surface & Background
  surface: {
    background: '#f9f9ff', // Off-white with cool tint (Stitch)
    bright: '#ffffff',
    container: {
      lowest: '#ffffff',
      low: '#f2f3fe',
      base: '#ecedf8',
      high: '#e6e8f2',
      highest: '#e0e2ec',
    },
    dim: '#d8d9e4',
    variant: '#e0e2ec',
  },

  // Neutral/Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563', // For secondary text
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic Colors
  text: {
    primary: '#181c23', // Stitch on-surface
    secondary: '#414754', // Stitch on-surface-variant
    tertiary: '#727785', // Outline
    muted: '#9997b5',
    inverse: '#ffffff',
    onPrimary: '#ffffff',
  },

  // State Colors
  error: {
    base: '#ba1a1a', // Stitch error
    container: '#ffdad6', // Stitch error-container
  },

  success: {
    base: '#28a745',
    light: '#d4edda',
  },

  warning: {
    base: '#ffc107',
    light: '#fff3cd',
  },

  info: {
    base: '#17a2b8',
    light: '#d1ecf1',
  },

  // Borders
  border: {
    subtle: '#f0f2f5', // Light border
    base: '#727785', // Stitch outline
    variant: '#c1c6d6', // Stitch outline-variant
    strong: '#414754',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// ============================================================
// TYPOGRAPHY
// ============================================================

export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    display: '"Plus Jakarta Sans", "Inter", sans-serif',
  },

  // Headings (Plus Jakarta Sans)
  headline: {
    xl: {
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
    lg: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
    },
    'lg-mobile': {
      fontSize: '22px',
      fontWeight: '600',
      lineHeight: '1.3',
    },
    md: {
      fontSize: '18px',
      fontWeight: '600',
      lineHeight: '1.4',
    },
  },

  // Body (Inter)
  body: {
    lg: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.6',
    },
    md: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    sm: {
      fontSize: '13px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
  },

  // Labels (Inter)
  label: {
    sm: {
      fontSize: '12px',
      fontWeight: '500',
      lineHeight: '1.2',
      letterSpacing: '0.01em',
    },
    xs: {
      fontSize: '11px',
      fontWeight: '500',
      lineHeight: '1.2',
      letterSpacing: '0.02em',
    },
  },
};

// ============================================================
// SPACING
// ============================================================

export const spacing = {
  // 8px grid base
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',

  // Layout-specific
  gutter: '24px', // Gutters between sections
  stack: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
  margin: {
    desktop: '40px',
    mobile: '16px',
  },
  container: {
    maxWidth: '1440px',
  },
};

// ============================================================
// BORDER RADIUS
// ============================================================

export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '8px', // Stitch ROUND_EIGHT
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px', // Pill-shaped

  // Component-specific
  button: '12px',
  card: '24px',
  input: '12px',
  avatar: '9999px', // Full circle
  chip: '8px',
};

// ============================================================
// SHADOWS
// ============================================================

export const shadows = {
  // Soft ambient (Level 1)
  sm: '0px 4px 20px rgba(0, 0, 0, 0.03)',
  // Standard (Level 2)
  base: '0px 8px 30px rgba(0, 0, 0, 0.06)',
  // Elevated
  lg: '0px 12px 40px rgba(0, 0, 0, 0.08)',
  // Maximum elevation
  xl: '0px 20px 60px rgba(0, 0, 0, 0.1)',
  // Subtle (borders)
  xs: '0px 2px 8px rgba(0, 0, 0, 0.02)',
};

// ============================================================
// TRANSITIONS & ANIMATIONS
// ============================================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  // Easing
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

// ============================================================
// COMPONENT SIZES
// ============================================================

export const componentSizes = {
  button: {
    sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
    md: { height: '40px', padding: '0 16px', fontSize: '14px' },
    lg: { height: '48px', padding: '0 20px', fontSize: '16px' },
    icon: {
      width: '40px',
      height: '40px',
      padding: '0',
      borderRadius: '9999px',
    },
  },

  input: {
    height: '40px',
    padding: '10px 16px',
    borderRadius: '12px',
  },

  avatar: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '56px',
    '2xl': '64px',
  },

  chip: {
    height: '28px',
    padding: '4px 12px',
    borderRadius: '8px',
  },
};

// ============================================================
// BREAKPOINTS
// ============================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
