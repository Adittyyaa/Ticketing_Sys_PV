// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface User {
  id: string
  email: string
  password_hash?: string
  full_name?: string | null
  role: string
  phone?: string | null
  job_title?: string | null
  company?: string | null
  avatar_url?: string | null
  email_verified: boolean
  last_login?: string | null
  created_at: string | Date
  updated_at: string | Date
}

export interface Ticket {
  id: string
  number: number
  user_id: string
  title: string
  description: string
  status: string
  priority: string
  category_id?: string | null
  type_id?: string | null
  assigned_to?: string | null
  product?: string | null
  product_reference_number?: string | null
  tags: string[]
  created_at: string | Date
  updated_at: string | Date
  resolved_at?: string | Date | null
  // Joined fields
  user_email?: string
  user_name?: string
  category_name?: string
  type_name?: string
  assigned_to_name?: string
  // Additional fields commonly used
  creator?: { full_name?: string; email?: string }
  assigned_user?: { full_name?: string; email?: string }
  comment_count?: number
  type?: string  // Alias for type_name
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  commenter_name?: string
  is_internal?: boolean
  created_at: string | Date
  updated_at: string | Date
  // Joined fields
  user_email?: string
  user_name?: string
}

export interface CategoryData {
  id: string
  name: string
  description?: string | null
  color: string
  created_at: string | Date
  updated_at: string | Date
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string | Date
  updated_at: string | Date
}

export interface TicketType {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  created_at: string | Date
  updated_at: string | Date
}

export interface Solution {
  id: string
  title: string
  description: string
  steps: string[]
  category_id?: string | null
  tags: string[]
  is_published: boolean
  views_count: number
  helpful_count: number
  created_by: string
  created_at: string | Date
  updated_at: string | Date
  // Joined fields
  category_name?: string
  author_name?: string
}

export interface CustomStatus {
  id: string
  name: string
  color: string
  is_closed_status: boolean
  created_at: string | Date
  updated_at: string | Date
}

export interface Attachment {
  id: string
  filename: string
  file_size: number
  mime_type: string
  url: string
  ticket_id?: string
  comment_id?: string
  created_at: string | Date
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string | null
  message?: string | null
}

export interface TicketAnalytics {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  closed_tickets: number
  high_priority_tickets: number
  urgent_priority_tickets: number
  avg_resolution_time_hours: number
  tickets_created_today: number
  tickets_resolved_today: number
}

export interface UserStatistics {
  user_id: string
  user_name: string
  user_email: string
  total_tickets_created: number
  open_tickets: number
  resolved_tickets: number
  avg_resolution_time_hours: number
}

// ============================================
// CONSTANTS AND ENUMS (TypeScript)
// ============================================

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  USER: 'user'
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


export const STATUS = TICKET_STATUSES
export const PRIORITY = TICKET_PRIORITIES

// Export the types for backward compatibility
export type Priority = keyof typeof TICKET_PRIORITIES
export type Status = keyof typeof TICKET_STATUSES

export const USER_ROLE_OPTIONS = Object.values(USER_ROLES)
export const TICKET_STATUS_OPTIONS = Object.values(TICKET_STATUSES)
export const TICKET_PRIORITY_OPTIONS = Object.values(TICKET_PRIORITIES)
