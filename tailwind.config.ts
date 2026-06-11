import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: {
          base: '#0b0f1a',
          surface: '#111827',
          elevated: '#1a2236',
          hover: '#1e293b',
          input: '#0f172a',
          sidebar: '#0b0f1a',
          'sidebar-hover': '#141b2d',
          'sidebar-active': '#1a2236',
        },
        // Text
        txt: {
          primary: '#f0f4f8',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          link: '#60a5fa',
          placeholder: '#475569',
        },
        // Brand
        brand: {
          primary: '#3b82f6',
          'primary-hover': '#2563eb',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4',
        },
        // Priority
        p: {
          low: '#10b981',
          'low-bg': '#064e3b',
          medium: '#3b82f6',
          'medium-bg': '#1e3a5f',
          high: '#f59e0b',
          'high-bg': '#78350f',
          urgent: '#ef4444',
          'urgent-bg': '#7f1d1d',
        },
        // Status
        s: {
          untouched: '#64748b',
          'untouched-bg': '#1e293b',
          pending: '#f59e0b',
          'pending-bg': '#78350f',
          opened: '#3b82f6',
          'opened-bg': '#1e3a5f',
          solved: '#10b981',
          'solved-bg': '#064e3b',
        },
        // Role
        role: {
          admin: '#a78bfa',
          'admin-bg': '#2e1065',
          user: '#3b82f6',
          'user-bg': '#1e3a5f',
        },
        // Borders
        bdr: {
          subtle: '#1e2d45',
          default: '#253347',
          strong: '#334155',
          focus: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.25' }],
        xs: ['11px', { lineHeight: '1.25' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['13px', { lineHeight: '1.5' }],
        md: ['14px', { lineHeight: '1.5' }],
        lg: ['16px', { lineHeight: '1.5' }],
        xl: ['18px', { lineHeight: '1.4' }],
        '2xl': ['20px', { lineHeight: '1.35' }],
        '3xl': ['24px', { lineHeight: '1.3' }],
      },
      spacing: {
        '0.5': '2px',
        '1.5': '6px',
        '2.5': '10px',
        '18': '72px',
        '88': '352px',
        '100': '400px',
        '120': '480px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
        sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
        DEFAULT: '0 4px 8px rgba(0, 0, 0, 0.4)',
        md: '0 4px 8px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.5)',
        focus: '0 0 0 2px rgba(59, 130, 246, 0.3)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      width: {
        sidebar: '240px',
        'sidebar-collapsed': '64px',
      },
      height: {
        header: '48px',
      },
      maxWidth: {
        content: '1400px',
      },
    },
  },
  plugins: [],
}
export default config
