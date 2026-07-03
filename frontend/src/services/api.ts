
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5001/api',  // Using port 5001
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

// Log the API URL being used (for debugging)
if (typeof window !== 'undefined') {
  console.log('🔗 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
  })
}


export const getDefaultHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { 'Authorization': `Bearer ${token}` }),
})


export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}


export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'


export interface RequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: any
  timeout?: number
}


export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl
    this.defaultHeaders = getDefaultHeaders()
  }

  setAuthToken(token: string) {
    this.defaultHeaders = getDefaultHeaders(token)
  }

  clearAuthToken() {
    this.defaultHeaders = getDefaultHeaders()
  }

  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.TIMEOUT,
    } = config

    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed')
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('API Request failed:', {
        url,
        method,
        baseUrl: this.baseUrl,
        endpoint,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  post<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'POST', body })
  }

  put<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body })
  }

  delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  patch<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body })
  }
}


export const apiClient = new ApiClient()

export default apiClient