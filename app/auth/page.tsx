'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Form, Input, Button, Card, message, Space, Typography, Alert, Divider, Row, Col } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined, SafetyOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

const { Title, Text, Paragraph } = Typography

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={100} 
            height={100} 
            style={{ borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }} 
          />
          <Title level={1} style={{ margin: '16px 0 8px 0', color: 'white' }}>
            Ticket System
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            Support & Issue Tracking Platform
          </Text>
        </div>

        {/* Login Card */}
        <Card
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            marginBottom: '16px',
          }}
        >
          {error && (
            <Alert
              message="Login Error"
              description={error}
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
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="you@example.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
                size="large"
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
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider>Quick Access</Divider>

          <Row gutter={[12, 12]}>
            <Col xs={12}>
              <Link href="/auth/login/user" style={{ textDecoration: 'none' }}>
                <Button block size="large" icon={<UserOutlined />}>
                  User Login
                </Button>
              </Link>
            </Col>
            <Col xs={12}>
              <Link href="/auth/login/admin" style={{ textDecoration: 'none' }}>
                <Button block size="large" danger icon={<SafetyOutlined />}>
                  Admin Login
                </Button>
              </Link>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link href="/auth/signup" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                Sign up
              </Link>
            </Text>
          </div>
        </Card>

        {/* Info Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontSize: '20px' }}>👤</div>
                <Text strong>User Access</Text>
                <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: '12px' }}>
                  View and manage your support tickets, track issues, and get real-time updates on ticket status.
                </Paragraph>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontSize: '20px' }}>🛡️</div>
                <Text strong>Admin Access</Text>
                <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: '12px' }}>
                  Manage all tickets, users, and system settings with full administrative privileges.
                </Paragraph>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
