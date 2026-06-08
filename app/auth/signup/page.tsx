'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Form, Input, Button, Card, message, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, GoogleOutlined } from '@ant-design/icons'
import Link from 'next/link'
import Image from 'next/image'

const { Title, Text } = Typography

export default function SignUpPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSignUp = async (values: any) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      // Create user profile with 'user' role
      if (authData.user) {
        await supabase.from('tbl_users').insert([
          {
            id: authData.user.id,
            email: values.email,
            full_name: values.fullName,
            role: 'user',
          },
        ])
      }

      setSuccess('Account created! Please check your email to confirm.')
      form.resetFields()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
      message.error(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
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
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google')
      setGoogleLoading(false)
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
        {/* Back navigation */}
        <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '24px' }}>
          <ArrowLeftOutlined />
          Back to login
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '12px' }}>
            <Image 
              src="/logo.jpeg" 
              alt="Logo" 
              width={72} 
              height={72} 
              style={{ borderRadius: '8px', display: 'inline-block' }} 
            />
          </div>
          <Title level={3} style={{ margin: '12px 0 4px 0', color: '#ffffff' }}>
            Create Account
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: '13px', display: 'block' }}>
            Sign up to get started as a user
          </Text>
        </div>

        {/* Sign Up Card */}
        <Card
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155',
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

          {success && (
            <Alert
              description={success}
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSignUp}
            autoComplete="off"
          >
            {/* Google Signup Button */}
            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="default"
                block
                size="large"
                icon={<GoogleOutlined />}
                loading={googleLoading}
                onClick={handleGoogleSignUp}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  borderColor: '#cbd5e1',
                  fontWeight: '500',
                  height: '44px',
                }}
              >
                Sign up with Google
              </Button>
            </Form.Item>

            <div style={{ position: 'relative', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #475569', zIndex: 1 }}></div>
              <span style={{ position: 'relative', zIndex: 2, padding: '0 8px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '13px' }}>
                Or sign up with email
              </span>
            </div>

            {/* Full Name */}
            <Form.Item
              label={<span style={{ color: '#cbd5e1' }}>Full Name</span>}
              name="fullName"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#64748b' }} />}
                placeholder="John Doe"
                size="large"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#ffffff',
                  minHeight: '44px',
                }}
              />
            </Form.Item>

            {/* Email */}
            <Form.Item
              label={<span style={{ color: '#cbd5e1' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#64748b' }} />}
                placeholder="you@example.com"
                size="large"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#ffffff',
                  minHeight: '44px',
                }}
              />
            </Form.Item>

            {/* Password */}
            <Form.Item
              label={<span style={{ color: '#cbd5e1' }}>Password</span>}
              name="password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#64748b' }} />}
                placeholder="••••••••"
                size="large"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#ffffff',
                  minHeight: '44px',
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6',
                  height: '44px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginTop: '12px',
                }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
              Already have an account?{' '}
              <Link href="/auth" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>
                Sign In
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
