'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Form, Input, Button, message, Modal, Space } from 'antd'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function ManageAdminsPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuthStore()
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (!isAdmin) { router.push('/tickets'); return }
    fetchAdmins()
  }, [isAdmin, router])

  const fetchAdmins = async () => {
    try {
      const { data } = await supabase.from('tbl_users').select('*').eq('role', 'admin').order('created_at', { ascending: false })
      if (data) setAdmins(data)
    } catch {
      message.error('Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (values: any) => {
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: values.email, password: values.password, fullName: values.fullName }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create admin')
      message.success('Admin created')
      form.resetFields()
      setShowForm(false)
      fetchAdmins()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error creating admin')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (userId: string, userName: string) => {
    if (userId === user?.id) { message.error('Cannot remove your own admin access'); return }
    Modal.confirm({
      title: 'Revoke Admin Access',
      content: `Remove admin access from ${userName}?`,
      okText: 'Revoke', okType: 'danger', cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase.from('tbl_users').update({ role: 'user' }).eq('id', userId)
          if (error) throw error
          message.success('Admin access revoked')
          fetchAdmins()
        } catch {
          message.error('Error revoking admin')
        }
      }
    })
  }

  if (loading) return null

  return (
    <AppShell>
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>Admin Management</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>{admins.length} administrator accounts</p>
          </div>
          <Space>
            <Button onClick={() => router.push('/admin')}>Dashboard</Button>
            <Button type="primary" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>+ Create Admin</Button>
          </Space>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <Form form={form} layout="vertical" onFinish={handleCreateAdmin}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
                <Form.Item name="fullName" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                  <Input placeholder="Full Name" />
                </Form.Item>
                <Form.Item name="email" rules={[{ required: true, type: 'email' }]} style={{ marginBottom: 0 }}>
                  <Input placeholder="Email Address" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, min: 6 }]} style={{ marginBottom: 0 }}>
                  <Input.Password placeholder="Password (min 6)" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>Create</Button>
              </div>
            </Form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {admins.map(adm => (
            <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {adm.full_name}
                  {adm.id === user?.id && <span style={{ color: 'var(--text-link)', fontSize: 11, padding: '1px 6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 4 }}>You</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{adm.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {new Date(adm.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {adm.id !== user?.id ? (
                  <Button type="text" danger onClick={() => handleDeleteAdmin(adm.id, adm.full_name)}>Revoke</Button>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 58, textAlign: 'right' }}>Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
