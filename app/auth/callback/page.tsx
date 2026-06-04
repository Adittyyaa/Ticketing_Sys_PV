'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange code for session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session) {
          // Get user role
          const { data: userData, error: userError } = await supabase
            .from('tbl_users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (userError) {
            console.error('Error fetching user role:', userError)
            // Default to user role if error
            router.push('/tickets')
            return
          }

          // Redirect based on role
          if (userData?.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/tickets')
          }
        } else {
          // No session, redirect to login
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
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Completing sign in...</p>
      </div>
    </div>
  )
}
