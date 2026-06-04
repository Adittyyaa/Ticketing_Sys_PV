export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type Status = 'UNTOUCHED' | 'PENDING' | 'OPENED' | 'SOLVED'
export type Category = 'Bug Report' | 'Technical Issue' | 'Account Inquiry' | 'New Feature Request' | 'Other'
export type UserRole = 'user' | 'admin'

export interface Ticket {
  id: string
  number: number
  title: string
  description: string
  category: Category
  priority: Priority
  status: Status
  created_at: string
  updated_at: string
  tags: string[]
  user_id: string
  assigned_to?: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  created_at: string
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    email: string
    full_name?: string
  }
}

export interface Attachment {
  id: string
  ticket_id: string
  user_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

export interface TicketAnalytics {
  total_tickets: number
  untouched_count: number
  pending_count: number
  opened_count: number
  solved_count: number
  low_priority: number
  medium_priority: number
  high_priority: number
  urgent_priority: number
  unique_users: number
  avg_resolution_hours: number
}
