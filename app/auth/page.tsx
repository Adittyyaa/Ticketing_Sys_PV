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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={72} 
            height={72} 
            style={{ borderRadius: '8px', display: 'inline-block', marginBottom: '12px' }} 
          />
          <Title level={3} style={{ margin: '12px 0 4px 0', color: '#ffffff' }}>
            {showAdminLogin ? 'Admin Login' : 'User Login'}
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
            {showAdminLogin ? 'Manage tickets and users' : 'Access your support tickets'}
          </Text>
        </div>

        {/* Login Card */}
        <Card
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155',
          }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
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
              label={<span style={{ color: '#cbd5e1' }}>Email</span>}
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
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#cbd5e1' }}>Password</span>}
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
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Toggle Admin Login */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
              {showAdminLogin ? (
                <>
                  User?{' '}
                  <button
                    onClick={() => {
                      setShowAdminLogin(false)
                      form.resetFields()
                      setError('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      fontSize: '13px',
                    }}
                  >
                    Back to User Login
                  </button>
                </>
              ) : (
                <>
                  Admin?{' '}
                  <button
                    onClick={() => {
                      setShowAdminLogin(true)
                      form.resetFields()
                      setError('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a78bfa',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      fontSize: '13px',
                    }}
                  >
                    Admin Login
                  </button>
                </>
              )}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
