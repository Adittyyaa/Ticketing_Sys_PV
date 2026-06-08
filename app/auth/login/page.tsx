'use client'

import { useState } from 'react'
import { Layout, Card, Form, Input, Button, Alert, Typography, Space, Avatar, Divider } from 'antd'
import { UserOutlined, LockOutlined, GoogleOutlined, LoginOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * UserLoginPage Component
 * Dedicated login page for regular users
 * Features:
 * - Email/password authentication
 * - Google OAuth integration
 * - Role verification (users only)
 * - Responsive design with Ant Design
 * - Link to signup page
 */
export default function UserLoginPage() {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle email/password login
   * Verifies user role before allowing access
   */
  const handleLogin = async (values: { email: string; password: string }) => {
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (signInError) throw signInError

      // Verify user role (must be 'user', not admin)
      const { data: userData } = await supabase
        .from('tbl_users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userData?.role !== 'user') {
        await supabase.auth.signOut()
        throw new Error('Invalid credentials for user login. Please use admin login.')
      }

      router.push('/tickets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=user`,
        },
      })

      if (googleError) throw googleError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login with Google')
      setGoogleLoading(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a202c 100%)'
    }}>
      <Content style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* ============================================ */}
          {/* HEADER */}
          {/* ============================================ */}
          <Space direction="vertical" size="large" align="center" style={{ width: '100%', marginBottom: '32px' }}>
            <Avatar src="/logo.jpeg" size={80} style={{ borderRadius: '12px' }} />
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>
                User Login
              </Title>
              <Text style={{ color: '#94a3b8' }}>
                Access your support tickets
              </Text>
            </div>
          </Space>

          {/* ============================================ */}
          {/* LOGIN CARD */}
          {/* ============================================ */}
          <Card
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderRadius: '12px',
            }}
            bodyStyle={{ padding: '32px' }}
          >
            {/* Error Alert */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
                style={{ marginBottom: '24px' }}
              />
            )}

            {/* Google Login Button */}
            <Button
              block
              size="large"
              icon={<GoogleOutlined />}
              onClick={handleGoogleLogin}
              loading={googleLoading}
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#1f2937',
                height: '48px',
                marginBottom: '24px',
              }}
            >
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {/* Divider */}
            <Divider style={{ color: '#64748b' }}>Or continue with email</Divider>

            {/* Email/Password Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleLogin}
              autoComplete="off"
            >
              {/* Email Field */}
              <Form.Item
                label={<span style={{ color: '#cbd5e1' }}>Email</span>}
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' },
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
                    height: '48px',
                  }}
                />
              </Form.Item>

              {/* Password Field */}
              <Form.Item
                label={<span style={{ color: '#cbd5e1' }}>Password</span>}
                name="password"
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#64748b' }} />}
                  placeholder="••••••••"
                  size="large"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#ffffff',
                    height: '48px',
                  }}
                />
              </Form.Item>

              {/* Submit Button */}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  icon={<LoginOutlined />}
                  loading={loading}
                  style={{
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* ============================================ */}
          {/* SIGNUP LINK */}
          {/* ============================================ */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Paragraph style={{ color: '#94a3b8', margin: 0 }}>
              Don't have an account?{' '}
              <Link href="/auth/signup" style={{ color: '#60a5fa' }}>
                Sign up
              </Link>
            </Paragraph>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
