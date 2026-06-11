'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Form, Input, Button, Alert, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons'
import Link from 'next/link'
import Image from 'next/image'

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
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px', background: 'linear-gradient(135deg, #0b0f1a 0%, #1a2236 50%, #0b0f1a 100%)', borderRight: '1px solid #1e2d45' }}>
        <Image src="/logo.jpeg" alt="Logo" width={56} height={56} style={{ borderRadius: 10, margin: '0 auto 24px', display: 'block' }} />
        <h1 style={{ color: '#f0f4f8', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Get Started</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Create an account to submit and track support tickets.</p>
      </div>

      <div style={{ width: 480, minWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', backgroundColor: '#0b0f1a' }}>
        <Link href="/auth" style={{ color: '#64748b', fontSize: 12, marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Back to sign in
        </Link>
        <h2 style={{ color: '#f0f4f8', fontSize: 20, fontWeight: 600, margin: '0 0 4px 0' }}>Create Account</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px 0' }}>Sign up to get started</p>

        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}
        {success && <Alert description={success} type="success" showIcon style={{ marginBottom: 16, borderRadius: 6 }} />}

        <Button block icon={<GoogleOutlined />} onClick={handleGoogleSignUp} loading={googleLoading}
          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1f2937', height: 40, fontWeight: 500, marginBottom: 16 }}>
          Sign up with Google
        </Button>

        <Divider style={{ borderColor: '#1e2d45', color: '#64748b', fontSize: 12, margin: '0 0 16px 0' }}>or sign up with email</Divider>

        <Form form={form} layout="vertical" onFinish={handleSignUp} autoComplete="off">
          <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Full Name</span>} name="fullName"
            rules={[{ required: true, message: 'Please enter your full name' }]}>
            <Input prefix={<UserOutlined style={{ color: '#475569' }} />} placeholder="John Doe" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Email</span>} name="email"
            rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Invalid email' }]}>
            <Input prefix={<MailOutlined style={{ color: '#475569' }} />} placeholder="you@example.com" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Password</span>} name="password"
            rules={[{ required: true, message: 'Please enter password' }, { min: 6, message: 'At least 6 characters' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#475569' }} />} placeholder="Create a password" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}
              style={{ height: 40, fontSize: 14, fontWeight: 600, borderRadius: 6 }}>Create Account</Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #1e2d45' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Already have an account? </span>
          <Link href="/auth" style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
