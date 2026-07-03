/**
 * Ticket-related constants
 * Constants specific to ticket functionality
 */

// Ticket statuses
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
} as const

export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.IN_PROGRESS]: 'In Progress',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
  [TICKET_STATUS.CLOSED]: 'Closed',
  [TICKET_STATUS.CANCELLED]: 'Cancelled'
} as const

// Ticket priorities
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const TICKET_PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: 'Low',
  [TICKET_PRIORITY.MEDIUM]: 'Medium',
  [TICKET_PRIORITY.HIGH]: 'High',
  [TICKET_PRIORITY.URGENT]: 'Urgent'
} as const

// Priority colors for UI
export const PRIORITY_COLORS = {
  [TICKET_PRIORITY.LOW]: '#52c41a',      // Green
  [TICKET_PRIORITY.MEDIUM]: '#1890ff',   // Blue
  [TICKET_PRIORITY.HIGH]: '#fa8c16',     // Orange
  [TICKET_PRIORITY.URGENT]: '#f5222d'    // Red
} as const

// Status colors for UI
export const STATUS_COLORS = {
  [TICKET_STATUS.OPEN]: '#1890ff',        // Blue
  [TICKET_STATUS.IN_PROGRESS]: '#fa8c16', // Orange
  [TICKET_STATUS.RESOLVED]: '#52c41a',    // Green
  [TICKET_STATUS.CLOSED]: '#595959',      // Gray
  [TICKET_STATUS.CANCELLED]: '#f5222d'    // Red
} as const

// Ticket categories
export const TICKET_CATEGORIES = [
  'Technical Support',
  'Bug Report',
  'Feature Request',
  'General Inquiry',
  'Account Issue',
  'Billing',
  'Integration',
  'Documentation',
  'Training',
  'Other'
] as const

// Ticket types
export const TICKET_TYPES = [
  'Incident',
  'Problem',
  'Change Request',
  'Service Request',
  'Question'
] as const

// Comment types
export const COMMENT_TYPE = {
  PUBLIC: 'public',
  INTERNAL: 'internal'
} as const

// Ticket field limits
export const TICKET_LIMITS = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 5000,
  COMMENT_MAX_LENGTH: 2000
} as const

// Sorting options
export const TICKET_SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'created_at_asc', label: 'Oldest First' },
  { value: 'updated_at_desc', label: 'Recently Updated' },
  { value: 'priority_desc', label: 'Priority (High to Low)' },
  { value: 'priority_asc', label: 'Priority (Low to High)' },
  { value: 'status_asc', label: 'Status (A-Z)' }
] as const

// Filter presets
export const TICKET_FILTER_PRESETS = {
  ALL: {
    label: 'All Tickets',
    filters: {}
  },
  OPEN: {
    label: 'Open Tickets',
    filters: { status: TICKET_STATUS.OPEN }
  },
  IN_PROGRESS: {
    label: 'In Progress',
    filters: { status: TICKET_STATUS.IN_PROGRESS }
  },
  HIGH_PRIORITY: {
    label: 'High Priority',
    filters: { priority: [TICKET_PRIORITY.HIGH, TICKET_PRIORITY.URGENT] }
  },
  MY_TICKETS: {
    label: 'My Tickets',
    filters: { created_by: 'current_user' }
  },
  ASSIGNED_TO_ME: {
    label: 'Assigned to Me',
    filters: { assigned_to: 'current_user' }
  }
} as const

// SLA (Service Level Agreement) times in hours
export const SLA_TIMES = {
  [TICKET_PRIORITY.LOW]: 72,     // 3 days
  [TICKET_PRIORITY.MEDIUM]: 48,  // 2 days
  [TICKET_PRIORITY.HIGH]: 24,    // 1 day
  [TICKET_PRIORITY.URGENT]: 8    // 8 hours
} as const