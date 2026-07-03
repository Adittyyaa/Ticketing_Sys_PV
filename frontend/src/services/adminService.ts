import { apiClient, ApiResponse, PaginatedResponse } from './api'
import type { User, CategoryData, Tag, TicketType, CustomStatus } from '@/types/types'

export interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  role?: string
}

export interface UpdateUserRequest {
  id: string
  email?: string
  full_name?: string
  role?: string
}

export class AdminService {
  
  async getUsers(filters?: { role?: string; email_verified?: boolean; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    
    const query = queryParams.toString()
    const endpoint = query ? `/admin/users?${query}` : '/admin/users'
    
    return apiClient.get<User[]>(endpoint)
  }

  async getUserById(id: number): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/admin/users/${id}`)
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/admin/users', userData)
  }

  async updateUser(userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/admin/users', userData)
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const url = new URL('/admin/users', window.location.origin)
    url.searchParams.set('id', id)
    return apiClient.request(url.toString(), { method: 'DELETE' })
  }

  async updateUserRole(id: string, role: string): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/admin/users', { id, role })
  }

  async verifyUserEmail(id: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/admin/users/${id}/verify-email`, {})
  }

  async getCategories(): Promise<ApiResponse<CategoryData[]>> {
    return apiClient.get<CategoryData[]>('/admin/categories')
  }

  async createCategory(data: { name: string; description?: string; color?: string }): Promise<ApiResponse<CategoryData>> {
    return apiClient.post<CategoryData>('/admin/categories', data)
  }

  async updateCategory(id: string, data: { name: string; description?: string; color?: string }): Promise<ApiResponse<CategoryData>> {
    return apiClient.put<CategoryData>('/admin/categories', { id, ...data })
  }

  async deleteCategory(id: string): Promise<ApiResponse> {
    const url = new URL('/admin/categories', window.location.origin)
    url.searchParams.set('id', id)
    return apiClient.request(url.toString(), { method: 'DELETE' })
  }

  async seedCategories(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/admin/seed', {})
  }

  async getTags(): Promise<ApiResponse<Tag[]>> {
    return apiClient.get<Tag[]>('/admin/tags')
  }

  async createTag(data: { name: string; color?: string }): Promise<ApiResponse<Tag>> {
    return apiClient.post<Tag>('/admin/tags', data)
  }

  async updateTag(id: string, data: { name: string; color?: string }): Promise<ApiResponse<Tag>> {
    return apiClient.put<Tag>('/admin/tags', { id, ...data })
  }

  async deleteTag(id: string): Promise<ApiResponse> {
    const url = new URL('/admin/tags', window.location.origin)
    url.searchParams.set('id', id)
    return apiClient.request(url.toString(), { method: 'DELETE' })
  }

  async getTicketTypes(): Promise<ApiResponse<TicketType[]>> {
    return apiClient.get<TicketType[]>('/admin/ticket-types')
  }

  async getCustomStatuses(): Promise<ApiResponse<CustomStatus[]>> {
    return apiClient.get<CustomStatus[]>('/admin/custom-statuses')
  }

  async createCustomStatus(data: { name: string; color: string }): Promise<ApiResponse<CustomStatus>> {
    return apiClient.post<CustomStatus>('/admin/custom-statuses', data)
  }

  async updateCustomStatus(id: string, data: { name: string; color: string }): Promise<ApiResponse<CustomStatus>> {
    return apiClient.put<CustomStatus>('/admin/custom-statuses', { id, ...data })
  }

  async deleteCustomStatus(id: string): Promise<ApiResponse> {
    const url = new URL('/admin/custom-statuses', window.location.origin)
    url.searchParams.set('id', id)
    return apiClient.request(url.toString(), { method: 'DELETE' })
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/admin/dashboard/stats')
  }

  async getTickets(filters?: { status?: string; priority?: string; category_id?: string; user_id?: string; assigned_to?: string; search?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const query = queryParams.toString()
    const endpoint = query ? `/admin/tickets?${query}` : '/admin/tickets'
    return apiClient.get(endpoint)
  }

  async getTicketById(id: string | number): Promise<ApiResponse<any>> {
    return apiClient.get(`/admin/tickets/${id}`)
  }

  async updateTicket(id: string | number, data: any): Promise<ApiResponse<any>> {
    return apiClient.put(`/admin/tickets/${id}`, data)
  }

  async deleteTicket(id: string | number): Promise<ApiResponse<any>> {
    return apiClient.delete(`/admin/tickets/${id}`)
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return apiClient.get('/admin/system/health')
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const res = await apiClient.get<{ user: User }>('/auth/profile')
    if (res.success && res.data && (res.data as any).user) {
      return { ...res, data: (res.data as any).user }
    }
    return res as any
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/admin/users/update-profile', data)
  }

  async getAttachments(ticketId: string | number): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`/admin/tickets/${ticketId}/attachments`)
  }

  async uploadAttachment(ticketId: string | number, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.request<any>(`/admin/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
      headers: {} as Record<string, string>
    })
  }

  async deleteAttachment(ticketId: string | number, attachmentId: number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/tickets/${ticketId}/attachments/${attachmentId}`)
  }

  async downloadAttachment(ticketId: string | number, attachmentId: number): Promise<ApiResponse<any>> {
    return apiClient.get(`/admin/tickets/${ticketId}/attachments/${attachmentId}/download`)
  }

  async getTicketComments(ticketId: string | number): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`/admin/tickets/${ticketId}/comments`)
  }

  async addTicketComment(ticketId: string | number, data: { content: string }): Promise<ApiResponse<any>> {
    return apiClient.post(`/admin/tickets/${ticketId}/comments`, data)
  }

  async deleteComment(commentId: string | number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/comments/${commentId}`)
  }
}

export const adminService = new AdminService()

export default adminService
