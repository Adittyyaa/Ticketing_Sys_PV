import { apiClient, ApiResponse, PaginatedResponse } from './api'
import type { Solution } from '@/types/types'

export interface CreateSolutionRequest {
  title: string
  description: string
  steps: string
  category?: string
}

export class SolutionService {
  
  async getSolutions(filters?: { search?: string; category?: string }): Promise<PaginatedResponse<Solution>> {
    const queryParams = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    
    const query = queryParams.toString()
    const endpoint = query ? `/solutions?${query}` : '/solutions'
    
    return apiClient.get<Solution[]>(endpoint)
  }

  async getSolution(id: string): Promise<ApiResponse<Solution>> {
    return apiClient.get<Solution>(`/solutions/${id}`)
  }

  async createSolution(solutionData: CreateSolutionRequest): Promise<ApiResponse<Solution>> {
    return apiClient.post<Solution>('/solutions', solutionData)
  }

  async updateSolution(id: string, solutionData: Partial<CreateSolutionRequest>): Promise<ApiResponse<Solution>> {
    return apiClient.put<Solution>('/solutions', { id, ...solutionData })
  }

  async deleteSolution(id: string): Promise<ApiResponse> {
    return apiClient.delete(`/solutions?id=${id}`)
  }

  async markHelpful(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/solutions/${id}/helpful`, {})
  }

  async search(query: string): Promise<PaginatedResponse<Solution>> {
    return apiClient.get<Solution[]>(`/solutions/search/${encodeURIComponent(query)}`)
  }

  async getByCategory(categoryId: string): Promise<PaginatedResponse<Solution>> {
    return apiClient.get<Solution[]>(`/solutions/category/${categoryId}`)
  }

  async getByTag(tag: string): Promise<PaginatedResponse<Solution>> {
    return apiClient.get<Solution[]>(`/solutions/tag/${tag}`)
  }
}

export const solutionService = new SolutionService()

export default solutionService
