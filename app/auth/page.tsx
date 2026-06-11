'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Form, Input, Button, message, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoginPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { setUser, setLoading, setIsAdmin } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLocalLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
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
      if (userData?.role === 'admin') router.push('/admin')
      else router.push('/tickets')
    } catch {
      router.push('/tickets')
    }
  }

  const handleLogin = async (values: { email: string; password: string }) => {
    setLocalLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (authError) throw authError
      if (data.user) {
        const { data: userData } = await supabase
          .from('tbl_users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single()
        setUser({ id: data.user.id, email: data.user.email || '', role: userData?.role || 'user' })
        setIsAdmin(userData?.role === 'admin')
        setLoading(false)
        message.success(`Welcome ${userData?.full_name || 'back'}!`)
        if (userData?.role === 'admin') router.push('/admin')
        else router.push('/tickets')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed'
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Theme Toggle - Fixed Position */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle size="large" />
      </div>

      {/* Left Panel - Brand */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #0b0f1a 0%, #1a2236 50%, #0b0f1a 100%)' 
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>H</span>
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 600, marginBottom: 12 }}>Helpdesk</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Streamline your support workflow. Track, resolve, and deliver exceptional service.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            {[{ v: '99%', l: 'Resolution Rate' }, { v: '<2m', l: 'Avg Response' }, { v: '24/7', l: 'Availability' }].map((s) => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--accent-primary)', fontSize: 20, fontWeight: 700 }}>{s.v}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ width: 480, minWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/logo.jpeg" alt="Logo" width={48} height={48} style={{ borderRadius: 8, display: 'inline-block' }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>
            {showAdminLogin ? 'Admin Sign In' : 'Sign In'}
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>
            {showAdminLogin ? 'Access the admin dashboard' : 'Access your support tickets'}
          </p>
        </div>

        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}

        <Form form={form} layout="vertical" onFinish={handleLogin} autoComplete="off">
          <Form.Item
            label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>}
            name="email"
            rules={[{ required: true, message: 'Email required' }, { type: 'email', message: 'Invalid email' }]}
          >
            <Input prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder={showAdminLogin ? 'admin@company.com' : 'you@example.com'} style={{ height: 40 }} />
          </Form.Item>
          <Form.Item
            label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Password</span>}
            name="password"
            rules={[{ required: true, message: 'Password required' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="Enter your password" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block icon={<LoginOutlined />} loading={loading}
              style={{ height: 40, fontSize: 14, fontWeight: 600, borderRadius: 6, backgroundColor: showAdminLogin ? '#7c3aed' : '#3b82f6', borderColor: showAdminLogin ? '#7c3aed' : '#3b82f6' }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{showAdminLogin ? 'Regular user?' : 'System administrator?'}</span>
          <button onClick={() => { setShowAdminLogin(!showAdminLogin); form.resetFields(); setError('') }}
            style={{ background: 'none', border: 'none', color: showAdminLogin ? 'var(--accent-primary)' : '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 6 }}>
            {showAdminLogin ? 'User Sign In' : 'Admin Sign In'}
          </button>
        </div>

        {!showAdminLogin && (
          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Don&apos;t have an account? </span>
            <Link href="/auth/signup" style={{ color: 'var(--text-link)', fontSize: 12, fontWeight: 600 }}>Create one</Link>
          </div>
        )}
      </div>
    </div>
  )
}

