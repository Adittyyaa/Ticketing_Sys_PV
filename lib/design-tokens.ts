// Freshworks DEW-inspired Design Tokens
// Single source of truth for all visual constants

// ── Colors ────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: {
    base: '#0b0f1a',
    surface: '#111827',
    elevated: '#1a2236',
    hover: '#1e293b',
    input: '#0f172a',
    sidebar: '#0b0f1a',
    sidebarHover: '#141b2d',
    sidebarActive: '#1a2236',
  },

  // Text
  text: {
    primary: '#f0f4f8',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    inverse: '#0b0f1a',
    link: '#60a5fa',
    placeholder: '#475569',
  },

  // Borders
  border: {
    subtle: '#1e2d45',
    default: '#253347',
    strong: '#334155',
    focus: '#3b82f6',
  },

  // Brand / Accent
  accent: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#1d4ed8',
    success: '#10b981',
    successHover: '#059669',
    warning: '#f59e0b',
    warningHover: '#d97706',
    error: '#ef4444',
    errorHover: '#dc2626',
    info: '#06b6d4',
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
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 4px 8px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.5)',
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
