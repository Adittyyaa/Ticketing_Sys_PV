'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const { setUser, setLoading, setIsAdmin } = useAuthStore()
  const [timeout, setTimeout] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeout(true)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Check user role
          const { data: userData } = await supabase
            .from('tbl_users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          const isAdmin = userData?.role === 'admin'
          setIsAdmin(isAdmin)

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: userData?.role || 'user',
          })

          // Route based on role
          if (isAdmin) {
            router.push('/admin')
          } else {
            router.push('/tickets')
          }
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="text-center">
        <div className="mb-6">
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={100} 
            height={100} 
            className="rounded-lg mx-auto animate-pulse"
          />
        </div>
        <p className="text-slate-400 text-lg">Loading...</p>
        {timeout && <p className="text-slate-500 text-sm mt-2">Taking longer than expected</p>}
      </div>
    </div>
  )
}
