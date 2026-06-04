'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function UnifiedLoginPage() {
  const router = useRouter()
  const { setUser, setLoading, setIsAdmin } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLocalLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // User already logged in, redirect to appropriate dashboard
        redirectBasedOnRole(session.user.id)
      }
    }
    checkSession()
  }, [])

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('tbl_users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userData?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/tickets')
      }
    } catch (error) {
      router.push('/tickets')
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (data.user) {
        // Get user role
        const { data: userData } = await supabase
          .from('tbl_users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single()

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: userData?.role || 'user',
        })
        setIsAdmin(userData?.role === 'admin')
        setLoading(false)

        // Redirect based on role
        if (userData?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/tickets')
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLocalLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLocalLoading(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google login failed')
      setLocalLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.jpeg" alt="Logo" width={80} height={80} className="rounded-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ticket System</h1>
          <p className="text-slate-400">Support & Issue Tracking Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">or</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-700 border border-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Login with Google
          </button>

          {/* Signup Link */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up here
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p>Your role determines your access level</p>
          <p>Admin accounts see all tickets • User accounts see only their tickets</p>
        </div>
      </div>
    </div>
  )
}
