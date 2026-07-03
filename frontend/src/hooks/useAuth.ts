/**
 * Authentication hook
 * Provides authentication state and methods
 */

import { useEffect, useState } from 'react'
import { authService } from '@/services'
import type { User } from '@/types/types'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize auth service
    authService.initialize()
    // Get stored user
    return authService.getUser()
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get stored user
    const storedUser = authService.getUser()

    // Validate token if user exists
    if (storedUser) {
      authService.validateToken().then(response => {
        if (!response.success) {
          // Token is invalid, clear user
          setUser(null)
          authService.logout()
        } else if (response.data) {
          // Update user with fresh data
          setUser(response.data.user)
        }
      })
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authService.login({ email, password })
      
      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during login' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser
  }
}