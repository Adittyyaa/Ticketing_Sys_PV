// ============================================
// CONSTANTS AND ENUMS (JavaScript)
// ============================================

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  AGENT: 'agent'
}

// Ticket statuses
export const TICKET_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_CUSTOMER: 'WAITING_FOR_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
}

// Ticket priorities
export const TICKET_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
}

// Legacy aliases for compatibility
export const STATUS = TICKET_STATUSES
export const PRIORITY = TICKET_PRIORITIES

// Export arrays for use in forms/dropdowns
export const USER_ROLE_OPTIONS = Object.values(USER_ROLES)
export const TICKET_STATUS_OPTIONS = Object.values(TICKET_STATUSES)
export const TICKET_PRIORITY_OPTIONS = Object.values(TICKET_PRIORITIES)
