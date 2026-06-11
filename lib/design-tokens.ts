// Freshworks DEW-inspired Design Tokens
// Single source of truth for all visual constants

// ── Colors ────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: {
    base: 'var(--bg-base)',
    surface: 'var(--bg-surface)',
    elevated: 'var(--bg-elevated)',
    hover: 'var(--bg-hover)',
    input: 'var(--bg-input)',
    sidebar: 'var(--bg-sidebar)',
    sidebarHover: 'var(--bg-sidebar-hover)',
    sidebarActive: 'var(--bg-sidebar-active)',
  },

  // Text
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
    inverse: '#0b0f1a',
    link: 'var(--text-link)',
    placeholder: 'var(--text-placeholder)',
  },

  // Borders
  border: {
    subtle: 'var(--border-subtle)',
    default: 'var(--border-default)',
    strong: 'var(--border-strong)',
    focus: 'var(--border-focus)',
  },

  // Brand / Accent
  accent: {
    primary: 'var(--accent-primary)',
    primaryHover: 'var(--accent-primary-hover)',
    primaryLight: '#1d4ed8',
    success: 'var(--accent-success)',
    successHover: '#059669',
    warning: 'var(--accent-warning)',
    warningHover: '#d97706',
    error: 'var(--accent-error)',
    errorHover: '#dc2626',
    info: 'var(--accent-info)',
  },

  // Priority
  priority: {
    low: '#10b981',
    lowBg: '#064e3b',
    medium: '#3b82f6',
    mediumBg: '#1e3a5f',
    high: '#f59e0b',
    highBg: '#78350f',
    urgent: '#ef4444',
    urgentBg: '#7f1d1d',
  },

  // Status
  status: {
    untouched: '#64748b',
    untouchedBg: '#1e293b',
    pending: '#f59e0b',
    pendingBg: '#78350f',
    opened: '#3b82f6',
    openedBg: '#1e3a5f',
    solved: '#10b981',
    solvedBg: '#064e3b',
  },

  // Role
  role: {
    admin: '#a78bfa',
    adminBg: '#2e1065',
    user: '#3b82f6',
    userBg: '#1e3a5f',
  },
} as const

// ── Typography ────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },
} as const

// ── Spacing (8px base) ────────────────────────────────────────────────────

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const

// ── Border Radius ─────────────────────────────────────────────────────────

export const radius = {
  sm: '4px',
  default: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

// ── Shadows ────────────────────────────────────────────────────────────────

export const shadows = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  focus: '0 0 0 2px rgba(59, 130, 246, 0.3)',
} as const

// ── Transitions ───────────────────────────────────────────────────────────

export const transitions = {
  fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  sidebar: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  headerHeight: 48,
  contentMaxWidth: 1400,
} as const

// ── Priority/Status display helpers ────────────────────────────────────────

import { Priority, Status } from '@/types/types'

export const priorityDisplay: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: colors.priority.low, bg: colors.priority.lowBg },
  MEDIUM: { label: 'Medium', color: colors.priority.medium, bg: colors.priority.mediumBg },
  HIGH: { label: 'High', color: colors.priority.high, bg: colors.priority.highBg },
  URGENT: { label: 'Urgent', color: colors.priority.urgent, bg: colors.priority.urgentBg },
}

export const statusDisplay: Record<Status, { label: string; color: string; bg: string }> = {
  UNTOUCHED: { label: 'Untouched', color: colors.status.untouched, bg: colors.status.untouchedBg },
  PENDING: { label: 'Pending', color: colors.status.pending, bg: colors.status.pendingBg },
  OPENED: { label: 'Opened', color: colors.status.opened, bg: colors.status.openedBg },
  SOLVED: { label: 'Solved', color: colors.status.solved, bg: colors.status.solvedBg },
}
