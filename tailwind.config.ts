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
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#3b82f6',
        // Pay-Ally light theme tokens
        canvas: '#F9FAFB',
        surface: '#FFFFFF',
        line: '#E5E7EB',
        ink: '#111827',
        muted: '#6B7280',
        faint: '#9CA3AF',
        brand: '#4F46E5',
        'brand-soft': '#EEF2FF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
