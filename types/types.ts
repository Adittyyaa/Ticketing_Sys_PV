export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type Status = 'UNTOUCHED' | 'PENDING' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'SOLVED' | 'CLOSED' | string
export type Category = 'Bug Report' | 'Technical Issue' | 'Account Inquiry' | 'New Feature Request' | 'Other' | string
export type UserRole = 'user' | 'admin'

export interface CategoryData {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface CustomStatus {
  id: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface TicketType {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  password_hash?: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  phone?: string
  job_title?: string
  company?: string
  email_verified: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  number: number
  title: string
  description: string
  category?: string // Legacy field for backward compatibility
  category_id?: string
  type?: string // Legacy field for backward compatibility
  type_id?: string
  product?: string
  product_reference_number?: string
  priority: Priority
  status: Status
  tags: string[] // Array of tag IDs
  user_id: string
  assigned_to?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  
  // Joined data (from views or queries)
  creator?: {
    id: string
    email: string
    full_name?: string
  }
  creator_email?: string
  creator_name?: string
  assigned_user?: {
    id: string
    email: string
    full_name?: string
  }
  assigned_email?: string
  assigned_name?: string
  category_name?: string
  category_color?: string
  type_name?: string
  type_description?: string
  tag_names?: string[]
  comment_count?: number
  attachment_count?: number
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_internal: boolean
  created_at: string
  updated_at: string
  
  // Joined data
  user_email?: string
  user_name?: string
}

export interface Attachment {
  id: string
  ticket_id: string
  user_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  mime_type?: string
  created_at: string
  
  // Joined data
  uploaded_by_email?: string
  uploaded_by_name?: string
}

export interface Solution {
  id: string
  title: string
  description: string
  steps: string
  category?: string // Legacy field for backward compatibility
  category_id?: string
  tags: string[] // Array of tag IDs
  is_published: boolean
  view_count: number
  helpful_count: number
  created_by?: string
  created_at: string
  updated_at: string
  
  // Joined data
  category_name?: string
  tag_names?: string[]
  author_name?: string
}

export interface Feedback {
  id: string
  user_id: string
  category: string
  rating: number
  message: string
  ticket_id?: string
  created_at: string
  
  // Joined data
  user_email?: string
  user_name?: string
  ticket_title?: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
  company?: string
  is_active: boolean
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
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

export interface UserStatistics {
  id: string
  email: string
  full_name?: string
  role: UserRole
  total_tickets_created: number
  tickets_solved: number
  total_tickets_assigned: number
  assigned_tickets_solved: number
  total_comments: number
  created_at: string
  last_login?: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form/Input types
export interface CreateTicketData {
  title: string
  description: string
  category_id?: string
  type_id?: string
  product?: string
  product_reference_number?: string
  priority?: Priority
  tags?: string[]
}

export interface UpdateTicketData {
  title?: string
  description?: string
  category_id?: string
  type_id?: string
  product?: string
  product_reference_number?: string
  priority?: Priority
  status?: Status
  tags?: string[]
  assigned_to?: string
}

export interface CreateUserData {
  email: string
  password?: string
  full_name?: string
  role?: UserRole
  phone?: string
  job_title?: string
  company?: string
}

export interface UpdateUserData {
  full_name?: string
  phone?: string
  job_title?: string
  company?: string
  avatar_url?: string
}

export interface CreateCommentData {
  content: string
  is_internal?: boolean
}

export interface CreateSolutionData {
  title: string
  description: string
  steps: string
  category_id?: string
  tags?: string[]
  is_published?: boolean
}
