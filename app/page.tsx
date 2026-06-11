'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

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
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        if (session?.user) {
          const { data: userData } = await supabase.from('tbl_users').select('role').eq('id', session.user.id).single()
          if (!isMounted) return
          const isAdmin = userData?.role === 'admin'
          setIsAdmin(isAdmin)
          setUser({ id: session.user.id, email: session.user.email || '', role: userData?.role || 'user' })
          if (isAdmin) router.push('/admin')
          else router.push('/tickets')
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #1e2d45', borderTopColor: '#3b82f6',
          margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</p>
        {timeout && <p style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>Taking longer than expected</p>}
      </div>
    </div>
  )
}
