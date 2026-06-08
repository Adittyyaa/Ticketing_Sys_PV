'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, message, Space, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import Image from 'next/image'
import Link from 'next/link'

const { Title, Text } = Typography

export default function UserLoginPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (signInError) throw signInError

      // Verify user role
      const { data: userData } = await supabase
        .from('tbl_users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userData?.role !== 'user') {
        await supabase.auth.signOut()
        throw new Error('Invalid credentials for user login. Please use admin login.')
      }

      message.success('Login successful!')
      router.push('/tickets')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to login'
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
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
      <Card
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={80} 
            height={80} 
            style={{ borderRadius: '8px', marginBottom: '16px', display: 'inline-block' }} 
          />
          <Title level={2} style={{ margin: '16px 0 8px 0' }}>
            User Login
          </Title>
          <Text type="secondary">Access your support tickets</Text>
        </div>

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
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link href="/auth/signup" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                Sign up
              </Link>
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Admin?{' '}
              <Link href="/auth/login/admin" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                Admin Login
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
