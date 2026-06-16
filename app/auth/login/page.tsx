'use client'

import { useState } from 'react'
import { Form, Input, Button, Alert, Segmented } from 'antd'
import { LockOutlined, LoginOutlined, MailOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuthStore } from '@/lib/store'

export default function UnifiedLoginPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { setUser, setIsAdmin } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user')

  const handleLogin = async (values: { email: string; password: string }) => {
    setError('')
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email: values.email, 
        password: values.password 
      })
      if (signInError) throw signInError

      const { data: userData } = await supabase
        .from('tbl_users')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      // Validate role matches selected role
      const userRole = userData?.role
      if (selectedRole === 'user' && userRole !== 'user') {
        await supabase.auth.signOut()
        throw new Error('This account does not have user access. Please use admin credentials.')
      }
      if (selectedRole === 'admin' && userRole !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('This account does not have admin access. Please use user credentials.')
      }

      // Store user and redirect
      setUser({ 
        id: data.user.id, 
        email: data.user.email || '', 
        role: userRole || 'user'
      })
      setIsAdmin(selectedRole === 'admin')
      router.push('/tickets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = {
    user: {
      icon: <UserOutlined />,
      title: 'User Portal',
      description: 'Access and manage your support tickets',
      label: 'User Account',
      color: 'var(--text-link)'
    },
    admin: {
      icon: <SafetyOutlined />,
      title: 'Admin Console',
      description: 'Manage tickets, users, and system settings',
      label: 'Admin Account',
      color: '#a78bfa'
    }
  }

  const config = roleConfig[selectedRole]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Theme Toggle - Fixed Position */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle size="large" />
      </div>

      {/* Left Brand Panel */}
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
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={56} 
            height={56} 
            style={{ borderRadius: 10, margin: '0 auto 24px', display: 'block' }} 
          />
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            {config.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ width: 480, minWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', backgroundColor: 'var(--bg-base)' }}>
        <h2 style={{ color: config.color, fontSize: 20, fontWeight: 600, margin: '0 0 4px 0' }}>
          Sign In
        </h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '0 0 24px 0' }}>
          Access your {selectedRole === 'admin' ? 'admin' : 'support'} {selectedRole === 'admin' ? 'console' : 'tickets'}
        </p>

        {/* Role Selector */}
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Select Account Type
          </label>
          <Segmented
            value={selectedRole}
            onChange={(value) => setSelectedRole(value as 'user' | 'admin')}
            options={[
              {
                label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UserOutlined /> User</span>,
                value: 'user'
              },
              {
                label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><SafetyOutlined /> Admin</span>,
                value: 'admin'
              }
            ]}
            style={{ width: '100%' }}
          />
        </div>

        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}

        <Form form={form} layout="vertical" onFinish={handleLogin} autoComplete="off">
          <Form.Item 
            label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>} 
            name="email"
            rules={[
              { required: true, message: 'Email is required' }, 
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: 'var(--text-tertiary)' }} />} 
              placeholder={selectedRole === 'admin' ? 'admin@company.com' : 'you@example.com'} 
              style={{ height: 40 }} 
            />
          </Form.Item>
          <Form.Item 
            label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Password</span>} 
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />} 
              placeholder="Enter your password" 
              style={{ height: 40 }} 
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              icon={<LoginOutlined />} 
              loading={loading}
              style={{ 
                height: 40, 
                fontSize: 14, 
                fontWeight: 600, 
                borderRadius: 6,
                ...(selectedRole === 'admin' && {
                  backgroundColor: '#7c3aed',
                  borderColor: '#7c3aed'
                })
              }}
            >
              Sign In as {selectedRole === 'admin' ? 'Admin' : 'User'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Don&apos;t have an account? </span>
          <Link href="/auth/signup" style={{ color: 'var(--text-link)', fontSize: 12, fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
    </div>
  )
}

