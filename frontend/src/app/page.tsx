'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { authService, adminService } from '@/services'

export default function Home() {
  const router = useRouter()
  const { setUser, setLoading, setIsAdmin } = useAuthStore()
  const [timeout, setTimeoutState] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimeoutState(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        const response = await authService.getMe()
        if (!isMounted) return
        if (response.success && response.data) {
          const userData = response.data.user
          
          const adminResponse = await adminService.getCurrentUser()
          const adminUserData = adminResponse.success && adminResponse.data ? adminResponse.data : userData
          
          const isAdmin = adminUserData?.role === 'admin'
          setIsAdmin(isAdmin)
          setUser({ id: userData.id, email: adminUserData?.email || '', full_name: adminUserData?.full_name || '', role: adminUserData?.role || 'user' })
          if (isMounted) router.push('/tickets')
        } else {
          if (isMounted) router.push('/auth')
        }
      } catch {
        if (isMounted) router.push('/auth')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    checkAuth()
    return () => { isMounted = false }
  }, [setUser, setLoading, setIsAdmin, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)',
          margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</p>
        {timeout && <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 8 }}>Taking longer than expected</p>}
      </div>
    </div>
  )
}
