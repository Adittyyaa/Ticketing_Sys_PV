'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (session) {
          const { data: userData, error: userError } = await supabase
            .from('tbl_users')
            .select('role')
            .eq('id', session.user.id)
            .single()
          if (userError) { router.push('/tickets'); return }
          if (userData?.role === 'admin') router.push('/admin')
          else router.push('/tickets')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/auth')
      }
    }
    handleCallback()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)',
          margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Completing sign in...</p>
      </div>
    </div>
  )
}
