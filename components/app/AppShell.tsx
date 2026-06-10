'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Loader2 } from 'lucide-react'

/**
 * AppShell
 * Shared authenticated layout: verifies the Supabase session, hydrates the
 * auth store, and renders the light-theme sidebar + topbar chrome.
 *
 * requireAdmin: when true, non-admins are redirected to /tickets.
 */
export function AppShell({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const router = useRouter()
  const { user, setUser, isAdmin, setIsAdmin, setLoading } = useAuthStore()
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        // Read role; auto-create a profile row if missing.
        let { data: userData, error } = await supabase
          .from('tbl_users')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single()

        if (error?.code === 'PGRST116') {
          const { data: created } = await supabase
            .from('tbl_users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || '',
                role: 'user',
                created_at: new Date().toISOString(),
              },
            ])
            .select('id, email, full_name, role')
            .single()
          userData = created
        }

        const admin = userData?.role === 'admin'

        if (requireAdmin && !admin) {
          router.push('/tickets')
          return
        }

        if (!active) return

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: userData?.role || 'user',
        })
        setIsAdmin(admin)
        setLoading(false)
        setReady(true)
      } catch (err) {
        console.error('[v0] Auth check failed:', err)
        router.push('/auth/login')
      }
    }

    checkAuth()
    return () => {
      active = false
    }
  }, [router, requireAdmin, setUser, setIsAdmin, setLoading])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    router.push('/auth/login')
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        role={isAdmin ? 'admin' : 'user'}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={user.email}
          role={isAdmin ? 'admin' : 'user'}
          onLogout={handleLogout}
          onMenu={() => setMenuOpen(true)}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
