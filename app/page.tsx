'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spin, Space, Typography, Avatar } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

const { Text } = Typography

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Home Page Component
 * Handles authentication check and redirects users based on their role
 * Features:
 * - Automatic session verification
 * - Role-based routing (admin → /admin, user → /tickets)
 * - Loading state with timeout indicator
 * - Professional Ant Design loading screen
 */
export default function Home() {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const router = useRouter()
  const { setUser, setLoading, setIsAdmin } = useAuthStore()
  const [timeout, setTimeoutState] = useState(false)

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Show timeout message after 5 seconds
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeoutState(true)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  /**
   * Check authentication status and redirect accordingly
   */
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          // Check user role from database
          const { data: userData } = await supabase
            .from('tbl_users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

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
          // No session - redirect to auth
          if (isMounted) {
            router.push('/auth')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          router.push('/auth')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [setUser, setLoading, setIsAdmin, router])

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a202c 100%)'
    }}>
      <Space direction="vertical" size="large" align="center">
        {/* Company Logo */}
        <Avatar 
          src="/logo.jpeg" 
          size={100}
          style={{ borderRadius: '12px' }}
        />
        
        {/* Loading Spinner with Text */}
        <Space direction="vertical" size="middle" align="center">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24, color: '#3b82f6' }} spin />}
            size="large"
          />
          <Text style={{ color: '#94a3b8', fontSize: '18px' }}>
            Loading...
          </Text>
          
          {/* Timeout Message */}
          {timeout && (
            <Text style={{ color: '#64748b', fontSize: '14px' }}>
              Taking longer than expected
            </Text>
          )}
        </Space>
      </Space>
    </div>
  )
}
