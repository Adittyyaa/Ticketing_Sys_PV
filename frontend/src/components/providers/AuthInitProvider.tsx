'use client'

import { useEffect } from 'react'
import { authService } from '@/services'

export function AuthInitProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth token from localStorage
    authService.initialize()
  }, [])

  return <>{children}</>
}
