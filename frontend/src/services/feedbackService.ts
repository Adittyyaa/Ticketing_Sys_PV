import { apiClient, ApiResponse, PaginatedResponse } from './api'

export interface CreateFeedbackRequest {
  ticket_id?: string
  solution_id?: string
  rating: number
  comment?: string
}

export class FeedbackService {
  
  async createFeedback(data: CreateFeedbackRequest): Promise<ApiResponse<any>> {
    return apiClient.post('/feedback', data)
  }

  async getTicketFeedback(ticketId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`/feedback/ticket/${ticketId}`)
  }

  async getSolutionFeedback(solutionId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/feedback/solution/${solutionId}`)
  }

  async getMyFeedback(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>('/feedback/my-feedback')
  }

  async updateFeedback(id: string, data: { rating?: number; comment?: string }): Promise<ApiResponse<any>> {
    return apiClient.put(`/feedback/${id}`, data)
  }

  async deleteFeedback(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/feedback/${id}`)
  }

  async getStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/feedback/stats/overview')
  }
}

export const feedbackService = new FeedbackService()

export default feedbackService
