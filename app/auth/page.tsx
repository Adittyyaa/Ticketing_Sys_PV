'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Form, Input, Button, Card, message, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

const { Title, Text } = Typography

export default function UnifiedLoginPage() {
  const router = useRouter()
  const { setUser, setLoading, setIsAdmin } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLocalLoading] = useState(false)
  const [error, setError] = useState('')

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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={80} 
            height={80} 
            style={{ borderRadius: '8px', display: 'inline-block', marginBottom: '12px' }} 
          />
          <Title level={2} style={{ margin: '12px 0 4px 0', color: '#ffffff' }}>
            Ticket System
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: '14px' }}>
            Support & Issue Tracking
          </Text>
        </div>

        {/* Login Card */}
        <Card
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            marginBottom: '12px',
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
                placeholder="you@example.com"
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
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
              User?{' '}
              <Link href="/auth/login/user" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>
                User Login
              </Link>
              {' '} | {' '}
              <Link href="/auth/login/admin" style={{ color: '#a78bfa', fontWeight: 'bold', textDecoration: 'none' }}>
                Admin Login
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
