'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, message, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import Image from 'next/image'
import Link from 'next/link'

import { useAuthStore } from '@/lib/store'

const { Title, Text } = Typography

export default function AdminLoginPage() {
  const router = useRouter()
  const { setUser, setIsAdmin } = useAuthStore()
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

      // Verify admin role
      const { data: userData } = await supabase
        .from('tbl_users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userData?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Invalid credentials for admin login.')
      }

      setUser({
        id: data.user.id,
        email: data.user.email || '',
        role: 'admin',
      })
      setIsAdmin(true)

      message.success('Admin login successful!')
      router.push('/admin')
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
          <Title level={3} style={{ margin: '12px 0 4px 0', color: '#a78bfa' }}>
            Admin Login
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
            Manage support tickets and users
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
              label={<span style={{ color: '#cbd5e1' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Email required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#64748b' }} />}
                placeholder="admin@pvadvisory.com"
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
                style={{ backgroundColor: '#a78bfa', borderColor: '#a78bfa' }}
              >
                Admin Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
              User?{' '}
              <Link href="/auth/login/user" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>
                User Login
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
