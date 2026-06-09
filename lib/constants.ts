import { Category, Priority, Status } from '../types/types'

// Ticket Categories
export const CATEGORIES: Category[] = [
  'Bug Report',
  'Technical Issue', 
  'Account Inquiry',
  'New Feature Request',
  'Other'
]

// Ticket Priorities
export const PRIORITIES: Priority[] = [
  'LOW',
  'MEDIUM', 
  'HIGH',
  'URGENT'
]

// Ticket Status Options
export const STATUS_OPTIONS: Status[] = [
  'UNTOUCHED',
  'PENDING',
  'OPENED', 
  'SOLVED'
]

// File Upload Constants
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'application/pdf',
  'text/plain'
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Priority Color Mapping
export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b', 
  HIGH: '#f97316',
  URGENT: '#ef4444'
}

// Priority CSS Classes for Tailwind
export const PRIORITY_CSS_CLASSES: Record<Priority, string> = {
  LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border border-red-500/20'
}

// Status Color Mapping  
export const STATUS_COLORS: Record<Status, string> = {
  UNTOUCHED: '#6b7280',
  PENDING: '#f59e0b',
  OPENED: '#3b82f6', 
  SOLVED: '#10b981'
}

// Status CSS Classes for Tailwind
export const STATUS_CSS_CLASSES: Record<Status, string> = {
  UNTOUCHED: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  PENDING: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  OPENED: 'bg-green-500/10 text-green-400 border border-green-500/20',
  SOLVED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
}

// Form Validation Constants
export const MAX_TITLE_LENGTH = 255
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_TAGS = 10
export const MAX_TAG_LENGTH = 50