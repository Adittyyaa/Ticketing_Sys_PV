'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import Image from 'next/image'
import Link from 'next/link'

export default function UserLoginPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
      if (signInError) throw signInError
      const { data: userData } = await supabase.from('tbl_users').select('role').eq('id', data.user.id).single()
      if (userData?.role !== 'user') {
        await supabase.auth.signOut()
        throw new Error('Invalid credentials for user login.')
      }
      router.push('/tickets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px', background: 'linear-gradient(135deg, #0b0f1a 0%, #1a2236 50%, #0b0f1a 100%)', borderRight: '1px solid #1e2d45' }}>
        <Image src="/logo.jpeg" alt="Logo" width={56} height={56} style={{ borderRadius: 10, margin: '0 auto 24px', display: 'block' }} />
        <h1 style={{ color: '#f0f4f8', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>User Portal</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Access and manage your support tickets.</p>
      </div>
      <div style={{ width: 480, minWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', backgroundColor: '#0b0f1a' }}>
        <h2 style={{ color: '#f0f4f8', fontSize: 20, fontWeight: 600, margin: '0 0 4px 0' }}>User Sign In</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px 0' }}>Access your support tickets</p>
        {error && <Alert description={error} type="error" showIcon closable afterClose={() => setError('')} style={{ marginBottom: 16, borderRadius: 6 }} />}
        <Form form={form} layout="vertical" onFinish={handleLogin} autoComplete="off">
          <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Email</span>} name="email"
            rules={[{ required: true, message: 'Email required' }, { type: 'email', message: 'Invalid email' }]}>
            <Input prefix={<UserOutlined style={{ color: '#475569' }} />} placeholder="you@example.com" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Password</span>} name="password"
            rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#475569' }} />} placeholder="Enter your password" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block icon={<LoginOutlined />} loading={loading}
              style={{ height: 40, fontSize: 14, fontWeight: 600, borderRadius: 6 }}>Sign In</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #1e2d45' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Admin? </span>
          <Link href="/auth/login/admin" style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>Admin Sign In</Link>
        </div>
      </div>
    </div>
  )
}
