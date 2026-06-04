export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type Status = 'UNTOUCHED' | 'PENDING' | 'OPENED' | 'SOLVED'
export type Category = 'Bug Report' | 'Technical Issue' | 'Account Inquiry' | 'New Feature Request' | 'Other'

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
  created_at: string
}
