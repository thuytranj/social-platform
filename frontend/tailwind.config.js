/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Stitch Primary Blue - with dark mode variants
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
          950: '#051d34',
          // Semantic overrides
          accent: '#0058bc',
          container: '#0070eb',
          dark: '#1877f2',
          // Dark mode variants
          'dark-400': '#4dd0e1',
          'dark-300': '#80deea',
          'dark-200': '#b2ebf2',
        },
        // Secondary (Slate) - with dark mode variants
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#54606a',
          700: '#475569',
          800: '#1e293b',
          // Dark mode variants
          'dark-400': '#cbd5e1',
          'dark-300': '#94a3b8',
          'dark-200': '#64748b',
        },
        // Stitch Surface & Background - enhanced with dark mode
        surface: {
          background: '#f9f9ff',
          bright: '#ffffff',
          50: '#f2f3fe',
          100: '#ecedf8',
          150: '#e6e8f2',
          200: '#e0e2ec',
          dim: '#d8d9e4',
          variant: '#e0e2ec',
          // Dark mode surfaces (MD3 standard)
          900: '#0f0f14',
          800: '#1a1a24',
          700: '#1e1e2c',
          600: '#252532',
          500: '#2d2d3d',
          // Additional dark mode tones for contrast
          'dark-inverse': '#f1f0ff',
        },
        // Text colors with CSS variable fallback
        ink: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          faint: 'var(--text-tertiary)',
        },
        // Borders with dark mode awareness
        borderVariant: '#c1c6d6',
        borderSubtle: '#f0f2f5',
        borderStrong: '#414754',
        borderBase: '#727785',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        // Stitch typography
        'headline-xl': [
          '32px',
          { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' },
        ],
        'headline-lg': [
          '24px',
          { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        'headline-md': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-sm': [
          '12px',
          { lineHeight: '1.2', fontWeight: '500', letterSpacing: '0.01em' },
        ],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.5s infinite',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        // Stitch shadows - soft ambient (light mode)
        xs: '0px 2px 8px rgba(0, 0, 0, 0.02)',
        sm: '0px 4px 20px rgba(0, 0, 0, 0.03)',
        base: '0px 8px 30px rgba(0, 0, 0, 0.06)',
        md: '0px 8px 30px rgba(0, 0, 0, 0.06)',
        lg: '0px 12px 40px rgba(0, 0, 0, 0.08)',
        xl: '0px 20px 60px rgba(0, 0, 0, 0.1)',
        // Glow variants
        'glow-sm': '0 0 12px rgba(124,58,237,0.3)',
        glow: '0 0 24px rgba(124,58,237,0.4)',
        'glow-lg': '0 0 40px rgba(124,58,237,0.5)',
        // Dark mode variants - more visible shadows
        'dark-xs': '0px 2px 12px rgba(0, 0, 0, 0.4)',
        'dark-sm': '0px 4px 24px rgba(0, 0, 0, 0.5)',
        'dark-base': '0px 8px 40px rgba(0, 0, 0, 0.6)',
        'dark-lg': '0px 12px 48px rgba(0, 0, 0, 0.7)',
        'dark-xl': '0px 20px 64px rgba(0, 0, 0, 0.8)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
