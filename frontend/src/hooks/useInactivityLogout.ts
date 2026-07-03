import { useEffect, useRef } from 'react'

interface UseInactivityLogoutOptions {
  timeout?: number // in milliseconds
  onLogout?: () => void
  excludeEvents?: string[]
}

export function useInactivityLogout({
  timeout = 30 * 60 * 1000, // 30 minutes default
  onLogout,
  excludeEvents = []
}: UseInactivityLogoutOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      onLogout?.()
    }, timeout)
  }

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      .filter(event => !excludeEvents.includes(event))

    const resetTimer = () => resetTimeout()

    // Set initial timeout
    resetTimeout()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true)
    })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true)
      })
    }
  }, [timeout, onLogout, excludeEvents, resetTimeout])

  return { resetTimeout }
}