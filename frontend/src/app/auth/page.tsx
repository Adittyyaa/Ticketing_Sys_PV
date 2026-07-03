'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuthStore } from '@/lib/store'
import { authService } from '@/services'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function LoginPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoadingState] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoadingState(true)
    setError('')
    try {
      const response = await authService.login(values)

      if (response.success && response.data) {
        const { setUser, setIsAdmin } = useAuthStore.getState()
        setUser(response.data.user)
        setIsAdmin(response.data.user.role === 'admin')

        router.push('/tickets')
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      setError(errorMsg)
    } finally {
      setLoadingState(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle size="large" />
      </div>

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
          <Image
            src="/logo.jpeg"
            alt="Logo"
            width={64}
            height={64}
            style={{ borderRadius: 12, margin: '0 auto 24px', display: 'block' }}
          />
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 600, marginBottom: 12 }}>
            HelpDesk
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Sign in to access your support tickets
          </p>
        </div>
      </div>

      <div style={{ width: 480, minWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>
            Sign In
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>
            Enter your credentials
          </p>
        </div>

        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}

        <Form form={form} layout="vertical" onFinish={handleLogin} autoComplete="off" key="login-form-v2">
          <Form.Item
            label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Email required' },
              { 
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email format' 
              }
            ]}
          >
            <Input prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="you@example.com" style={{ height: 40 }} />
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
              style={{ height: 40, fontSize: 14, fontWeight: 600, borderRadius: 6 }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
