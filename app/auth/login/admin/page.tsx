'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

export default function AdminLoginPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { setUser, setIsAdmin } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
      if (signInError) throw signInError
      const { data: userData } = await supabase.from('tbl_users').select('role').eq('id', data.user.id).single()
      if (userData?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Invalid credentials for admin login.')
      }
      setUser({ id: data.user.id, email: data.user.email || '', role: 'admin' })
      setIsAdmin(true)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Theme Toggle - Fixed Position */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle size="large" />
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '48px', 
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0b0f1a 0%, #1a2236 50%, #0b0f1a 100%)' 
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        borderRight: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>A</span>
        </div>
        <h1 style={{ 
          color: 'var(--text-primary)', 
          fontSize: 24, 
          fontWeight: 600, 
          marginBottom: 8 
        }}>Admin Console</h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 14 
        }}>Manage tickets, users, and system settings.</p>
      </div>
      <div style={{ 
        width: 480, 
        minWidth: 480, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '48px', 
        backgroundColor: 'var(--bg-base)'
      }}>
        <h2 style={{ color: '#a78bfa', fontSize: 20, fontWeight: 600, margin: '0 0 4px 0' }}>Admin Sign In</h2>
        <p style={{ 
          color: 'var(--text-tertiary)', 
          fontSize: 13, 
          margin: '0 0 24px 0' 
        }}>Manage support tickets and users</p>
        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}
        <Form form={form} layout="vertical" onFinish={handleLogin} autoComplete="off">
          <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>} name="email"
            rules={[{ required: true, message: 'Email required' }, { type: 'email', message: 'Invalid email' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="admin@company.com" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Password</span>} name="password"
            rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="Enter your password" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block icon={<LoginOutlined />} loading={loading}
              style={{ height: 40, fontSize: 14, fontWeight: 600, borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>Admin Sign In</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Regular user? </span>
          <Link href="/auth/login/user" style={{ color: 'var(--text-link)', fontSize: 12, fontWeight: 600 }}>User Sign In</Link>
        </div>
      </div>
    </div>
  )
}
