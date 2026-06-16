'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { Form, Input, Button, message } from 'antd'
import { Send, Mail, User, Building, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ContactPage() {
  const router = useRouter()
  const { user, setUser, setIsAdmin, setLoading } = useAuthStore()
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }
        setUser({ id: session.user.id, email: session.user.email || '', role: (session.user.role as 'user' | 'admin') || 'user' })
        setIsAdmin(session.user.role === 'admin')
        setLoading(false)
      } catch { router.push('/auth') }
    }
    checkAuth()
  }, [router, setUser, setIsAdmin, setLoading])

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(values)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to send message')
      
      message.success('Message sent successfully!')
      form.resetFields()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error sending message')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600, margin: 0 }}>Contact Us</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '8px 0 0 0' }}>Reach out to our support team for assistance</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Contact Information</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={20} color="var(--accent-primary)" />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Email</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>support@pvadvisory.com</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Phone size={20} color="var(--accent-success)" />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Phone</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>+1 (555) 123-4567</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Building size={20} color="var(--accent-warning)" />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Office Hours</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>Mon-Fri: 9AM - 6PM PST</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Send a Message</h3>
            
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter your name' }]}>
                <Input prefix={<User size={16} />} placeholder="Your name" />
              </Form.Item>

              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                <Input prefix={<Mail size={16} />} placeholder="your@email.com" />
              </Form.Item>

              <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Please enter a subject' }]}>
                <Input placeholder="How can we help you?" />
              </Form.Item>

              <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Please enter your message' }]}>
                <Input.TextArea placeholder="Describe your inquiry..." rows={5} maxLength={1000} />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting} 
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', width: '100%' }}
                  icon={<Send size={16} />}
                >
                  Send Message
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </AppShell>
  )
}