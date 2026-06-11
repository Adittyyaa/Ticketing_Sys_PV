import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

export function useInactivityLogout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownWarningRef = useRef(false)

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    hasShownWarningRef.current = false

    // Set warning timeout (4.5 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      if (!hasShownWarningRef.current) {
        hasShownWarningRef.current = true
        console.warn('⚠️ You will be logged out in 30 seconds due to inactivity')
      }
    }, INACTIVITY_TIMEOUT - 30000)

    // Set logout timeout (5 minutes)
    timeoutRef.current = setTimeout(() => {
      logout()
    }, INACTIVITY_TIMEOUT)
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return
      }

      // Set up event listeners for user activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

      const handleActivity = () => {
        resetTimeout()
      }

      // Add event listeners
      events.forEach((event) => {
        document.addEventListener(event, handleActivity, true)
      })

      // Initial timeout setup
      resetTimeout()

      // Cleanup function
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
