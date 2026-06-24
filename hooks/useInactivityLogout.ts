import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

export function useInactivityLogout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownWarningRef = useRef(false)

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    hasShownWarningRef.current = false

    warningTimeoutRef.current = setTimeout(() => {
      if (!hasShownWarningRef.current) {
        hasShownWarningRef.current = true
        console.warn('⚠️ You will be logged out in 30 seconds due to inactivity')
      }
    }, INACTIVITY_TIMEOUT - 30000)

    timeoutRef.current = setTimeout(() => {
      logout()
    }, INACTIVITY_TIMEOUT)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' })
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/me', { method: 'GET' })
      if (!response.ok) {
        return
      }

      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

      const handleActivity = () => {
        resetTimeout()
      }

      events.forEach((event) => {
        document.addEventListener(event, handleActivity, true)
      })

      resetTimeout()

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleActivity, true)
        })
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      }
    }

    const cleanup = checkAuth()

    return () => {
      cleanup.then((fn) => fn && fn())
    }
  }, [router])
}