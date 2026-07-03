import { apiClient, ApiResponse, PaginatedResponse } from './api'
import type { Ticket, Comment, Attachment } from '@/types/types'

export interface TicketFilters {
  status?: string
  priority?: string
  category_id?: string
  assigned_to?: string
  created_by?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateTicketRequest {
  title: string
  description: string
  priority?: string
  category_id?: string
  type_id?: string
  tags?: string[]
  product?: string
  product_reference_number?: string
}

export interface UpdateTicketRequest {
  title?: string
  description?: string
  priority?: string
  status?: string
  category_id?: string
  type_id?: string
  assigned_to?: string
  tags?: string[]
}

export interface CreateCommentRequest {
  content: string
  is_internal?: boolean
}

export interface TicketStats {
  total: number
  open: number
  closed: number
  in_progress: number
  by_priority: Record<string, number>
  by_category: Record<string, number>
}

export class TicketService {

  async getTickets(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
    const queryParams = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const query = queryParams.toString()
    const endpoint = query ? `/tickets?${query}` : '/tickets'

    return apiClient.get<Ticket[]>(endpoint)
  }

  async getTicketById(id: number): Promise<ApiResponse<Ticket>> {
    return apiClient.get<Ticket>(`/tickets/${id}`)
  }

  async createTicket(ticketData: CreateTicketRequest): Promise<ApiResponse<Ticket>> {
    return apiClient.post<Ticket>('/tickets', ticketData)
  }

  async updateTicket(id: number, ticketData: UpdateTicketRequest): Promise<ApiResponse<Ticket>> {
    return apiClient.put<Ticket>(`/tickets/${id}`, ticketData)
  }

  async deleteTicket(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/tickets/${id}`)
  }

  async updateTicketStatus(id: number, status: string): Promise<ApiResponse<Ticket>> {
    return apiClient.put<Ticket>(`/tickets/${id}/status`, { status })
  }

  async assignTicket(id: number, assignedTo: number): Promise<ApiResponse<Ticket>> {
    return apiClient.put<Ticket>(`/tickets/${id}/assign`, { assigned_to: assignedTo })
  }

  async getTicketComments(ticketId: number): Promise<ApiResponse<Comment[]>> {
    return apiClient.get<Comment[]>(`/tickets/${ticketId}/comments`)
  }

  async addComment(ticketId: number, commentData: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    return apiClient.post<Comment>(`/tickets/${ticketId}/comments`, commentData)
  }

  async getTicketAttachments(ticketId: number): Promise<ApiResponse<Attachment[]>> {
    return apiClient.get<Attachment[]>(`/tickets/${ticketId}/attachments`)
  }

  async uploadAttachment(ticketId: number, file: File): Promise<ApiResponse<Attachment>> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.request<Attachment>(`/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async deleteAttachment(ticketId: number, attachmentId: number): Promise<ApiResponse> {
    return apiClient.delete(`/tickets/${ticketId}/attachments/${attachmentId}`)
  }

  async getTicketStats(): Promise<ApiResponse<TicketStats>> {
    return apiClient.get<TicketStats>('/tickets/stats')
  }

  async searchTickets(query: string, filters?: Omit<TicketFilters, 'search'>): Promise<PaginatedResponse<Ticket>> {
    const searchFilters = { ...filters, search: query }
    return this.getTickets(searchFilters)
  }

  async getMyTickets(filters?: Omit<TicketFilters, 'created_by'>): Promise<PaginatedResponse<Ticket>> {
    return this.getTickets(filters)
  }

  async getAssignedTickets(filters?: Omit<TicketFilters, 'assigned_to'>): Promise<PaginatedResponse<Ticket>> {
    return this.getTickets(filters)
  }
}

export const ticketService = new TicketService()

export default ticketService
