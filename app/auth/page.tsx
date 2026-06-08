'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Form, Input, Button, Card, message, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

const { Title, Text } = Typography

export default function LoginPage() {
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

      if (userData?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/tickets')
      }
    } catch (error) {
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

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: userData?.role || 'user',
        })
        setIsAdmin(userData?.role === 'admin')
        setLoading(false)

        message.success(`Welcome ${userData?.full_name || 'back'}!`)

        if (userData?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/tickets')
        }
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: '#0a0e1a',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header - Mobile Responsive */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '32px', 
          paddingTop: '16px',
          paddingBottom: '8px',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <Image 
              src="/logo.jpeg" 
              alt="Logo" 
              width={72} 
              height={72} 
              style={{ 
                borderRadius: '8px', 
                display: 'inline-block',
              }} 
            />
          </div>
          <Title level={3} style={{ 
            margin: '12px 0 4px 0', 
            color: '#ffffff',
            fontSize: 'clamp(20px, 5vw, 24px)',
          }}>
            {showAdminLogin ? 'Admin Login' : 'User Login'}
          </Title>
          <Text style={{ 
            color: '#94a3b8', 
            fontSize: 'clamp(12px, 3vw, 13px)',
            display: 'block',
          }}>
            {showAdminLogin ? 'Manage tickets & users' : 'Access your tickets'}
          </Text>
        </div>

        {/* Login Card */}
        <Card
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            margin: '0 0 16px 0',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          {error && (
            <Alert
              description={error}
              type="error"
              showIcon
              closable
              afterClose={() => setError('')}
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
          >
            <Form.Item
              label={<span style={{ color: '#cbd5e1', fontSize: 'clamp(12px, 2vw, 14px)' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Email required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#64748b' }} />}
                placeholder={showAdminLogin ? 'admin@pvadvisory.com' : 'you@example.com'}
                size="large"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#ffffff',
                  padding: '10px 12px',
                  fontSize: '16px',
                  minHeight: '44px',
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#cbd5e1', fontSize: 'clamp(12px, 2vw, 14px)' }}>Password</span>}
              name="password"
              rules={[{ required: true, message: 'Password required' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#64748b' }} />}
                placeholder="••••••••"
                size="large"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#ffffff',
                  padding: '10px 12px',
                  fontSize: '16px',
                  minHeight: '44px',
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={<LoginOutlined />}
                loading={loading}
                style={{ 
                  backgroundColor: showAdminLogin ? '#a78bfa' : '#3b82f6',
                  borderColor: showAdminLogin ? '#a78bfa' : '#3b82f6',
                  height: '44px',
                  fontSize: '16px',
                  fontWeight: '600',
                  minHeight: '44px',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Toggle Button - Mobile Accessible */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '16px',
            paddingTop: '12px',
          }}>
            <button
              onClick={() => {
                setShowAdminLogin(!showAdminLogin)
                form.resetFields()
                setError('')
              }}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: showAdminLogin ? '#3b82f6' : '#a78bfa',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                fontSize: 'clamp(12px, 3vw, 14px)',
                padding: '12px 16px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                minWidth: '160px',
                display: 'inline-block',
                width: '100%',
                maxWidth: '240px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155'
                e.currentTarget.style.borderColor = showAdminLogin ? '#3b82f6' : '#a78bfa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = '#334155'
              }}
              aria-label={showAdminLogin ? 'Back to user login' : 'Switch to admin login'}
            >
              {showAdminLogin ? '← Back to User' : 'Admin → Switch'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
