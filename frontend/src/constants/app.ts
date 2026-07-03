/**
 * Application constants
 * Global constants used throughout the application
 */

// Application metadata
export const APP_NAME = 'PV Advisory Ticketing System'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Professional ticketing system for PV Advisory services'

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
export const API_TIMEOUT = 30000

// Authentication
export const TOKEN_STORAGE_KEY = 'pv_advisory_token'
export const USER_STORAGE_KEY = 'pv_advisory_user'
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy'
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm'
export const TIME_FORMAT = 'HH:mm'

// Theme configuration
export const THEME_STORAGE_KEY = 'pv_advisory_theme'
export const DEFAULT_THEME = 'light'

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  TICKETS: '/tickets',
  TICKET_DETAIL: '/tickets/[id]',
  ADMIN: '/admin',
  PROFILE: '/profile',
  SOLUTIONS: '/solutions',
  FAQ: '/faq',
  CONTACT: '/contact'
} as const

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: TOKEN_STORAGE_KEY,
  USER: USER_STORAGE_KEY,
  THEME: THEME_STORAGE_KEY,
  PREFERENCES: 'pv_advisory_preferences',
  DRAFT_TICKET: 'pv_advisory_draft_ticket'
} as const

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
} as const

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const

// Feature flags
export const FEATURES = {
  ENABLE_FILE_UPLOADS: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_FEEDBACK_SYSTEM: true
} as const