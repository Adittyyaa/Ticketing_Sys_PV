'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Form, Input, Button, Alert, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

export default function SignUpPage() {
  const { theme } = useTheme()
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
        options: { data: { full_name: values.fullName } },
      })
      if (signUpError) throw signUpError
      if (authData.user) {
        await supabase.from('tbl_users').insert([{ id: authData.user.id, email: values.email, full_name: values.fullName, role: 'user' }])
      }
      setSuccess('Account created! Please check your email to confirm.')
      form.resetFields()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
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
        options: { redirectTo: `${window.location.origin}/auth/callback?role=user` },
      })
      if (googleError) throw googleError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Theme Toggle - Fixed Position */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle size="large" />
      </div>

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
        <Image src="/logo.jpeg" alt="Logo" width={56} height={56} style={{ borderRadius: 10, margin: '0 auto 24px', display: 'block' }} />
        <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Get Started</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create an account to submit and track support tickets.</p>
      </div>

      <div style={{ width: 480, minWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', backgroundColor: 'var(--bg-base)' }}>
        <Link href="/auth" style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Back to sign in
        </Link>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: '0 0 4px 0' }}>Create Account</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '0 0 24px 0' }}>Sign up to get started</p>

        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}
        {success && <Alert description={success} type="success" showIcon style={{ marginBottom: 16, borderRadius: 6 }} />}

        <Button block icon={<GoogleOutlined />} onClick={handleGoogleSignUp} loading={googleLoading}
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--bg-elevated)' : '#fff', 
            borderColor: 'var(--border-default)', 
            color: 'var(--text-primary)', 
            height: 40, 
            fontWeight: 500, 
            marginBottom: 16 
          }}>
          Sign up with Google
        </Button>

        <Divider style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: 12, margin: '0 0 16px 0' }}>or sign up with email</Divider>

        <Form form={form} layout="vertical" onFinish={handleSignUp} autoComplete="off">
          <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Full Name</span>} name="fullName"
            rules={[{ required: true, message: 'Please enter your full name' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="John Doe" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>} name="email"
            rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Invalid email' }]}>
            <Input prefix={<MailOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="you@example.com" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Password</span>} name="password"
            rules={[{ required: true, message: 'Please enter password' }, { min: 6, message: 'At least 6 characters' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="Create a password" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}
              style={{ height: 40, fontSize: 14, fontWeight: 600, borderRadius: 6 }}>Create Account</Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Already have an account? </span>
          <Link href="/auth" style={{ color: 'var(--text-link)', fontSize: 12, fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}

