/**
 * API hook
 * Generic hook for making API calls with loading states and error handling
 */

import { useState, useCallback } from 'react'
import { ApiResponse } from '@/services'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: () => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  immediate = false
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await apiCall()
      
      if (response.success && response.data !== undefined) {
        setState({
          data: response.data,
          loading: false,
          error: null
        })
        return response.data
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'An error occurred'
        })
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })
      return null
    }
  }, [apiCall])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  // Execute immediately if requested
  useState(() => {
    if (immediate) {
      execute()
    }
  })

  return {
    ...state,
    execute,
    reset
  }
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<T[]>>,
  pageSize = 20
) {
  const [page, setPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)

  const api = useApi(() => apiCall(page, pageSize), false)

  const loadMore = useCallback(async () => {
    if (api.loading || !hasMore) return

    const result = await api.execute()
    
    if (result && Array.isArray(result)) {
      setAllData(prev => [...prev, ...result])
      setHasMore(result.length === pageSize)
      setPage(prev => prev + 1)
    } else {
      setHasMore(false)
    }
  }, [api, hasMore, pageSize])

  const reset = useCallback(() => {
    setPage(1)
    setAllData([])
    setHasMore(true)
    api.reset()
  }, [api])

  return {
    data: allData,
    loading: api.loading,
    error: api.error,
    hasMore,
    loadMore,
    reset
  }
}