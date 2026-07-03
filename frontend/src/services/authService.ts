import { apiClient, ApiResponse, PaginatedResponse } from './api'
import type { User } from '@/types/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  phone?: string
  job_title?: string
  company?: string
}

export interface AuthResponse {
  user: User
  token: string
  message?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ResetPasswordConfirmRequest {
  resetToken: string
  newPassword: string
}

export class AuthService {
  private static readonly TOKEN_KEY = 'pv_advisory_token'
  private static readonly USER_KEY = 'pv_advisory_user'

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.setAuthData(response.data.token, response.data.user)
    }
    
    return response
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData)
    
    if (response.success && response.data) {
      this.setAuthData(response.data.token, response.data.user)
    }
    
    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    this.clearAuthData()
    return response
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/profile')
  }

  async validateToken(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>('/auth/profile')
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>('/auth/profile')
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/profile')
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    return apiClient.post('/auth/change-password', data)
  }

  async requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse> {
    return apiClient.post('/auth/request-password-reset', data)
  }

  async resetPassword(data: ResetPasswordConfirmRequest): Promise<ApiResponse> {
    return apiClient.post('/auth/reset-password', data)
  }

  async logoutViaDelete(): Promise<ApiResponse> {
    return apiClient.request('/auth/login', { method: 'DELETE' })
  }

  private setAuthData(token: string, user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AuthService.TOKEN_KEY, token)
      localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user))
    }
    apiClient.setAuthToken(token)
  }

  private clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AuthService.TOKEN_KEY)
      localStorage.removeItem(AuthService.USER_KEY)
    }
    apiClient.clearAuthToken()
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(AuthService.TOKEN_KEY)
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem(AuthService.USER_KEY)
    return userData ? JSON.parse(userData) : null
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  initialize() {
    const token = this.getToken()
    if (token) {
      apiClient.setAuthToken(token)
    }
  }

  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role === role
  }

  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  isAgent(): boolean {
    return this.hasRole('agent') || this.isAdmin()
  }
}

export const authService = new AuthService()

export default authService
