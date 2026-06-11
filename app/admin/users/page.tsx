'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Table, Form, Input, Button, message, Modal, Tag, Space } from 'antd'
import { Plus, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const { isAdmin } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (!isAdmin) { router.push('/tickets'); return }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('tbl_users').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
    } catch { message.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const handleCreateUser = async (values: any) => {
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: values.email, password: values.password, fullName: values.fullName }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create user')
      message.success('User created!')
      form.resetFields()
      setShowForm(false)
      fetchUsers()
    } catch (err) { message.error(err instanceof Error ? err.message : 'Error creating user') }
    finally { setSubmitting(false) }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Delete ${email}? This cannot be undone.`,
      okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase.from('tbl_users').delete().eq('id', userId)
          if (error) throw error
          message.success('User deleted')
          fetchUsers()
        } catch { message.error('Error deleting user') }
      }
    })
  }

  const columns = [
    { title: 'Name', dataIndex: 'full_name', key: 'full_name', render: (t: string) => <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t || 'N/A'}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t: string) => <span style={{ color: 'var(--text-secondary)' }}>{t}</span> },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 120, render: (r: string) => <Tag color={r === 'admin' ? 'purple' : 'blue'}>{r === 'admin' ? 'Admin' : 'User'}</Tag> },
    { title: 'Joined', dataIndex: 'created_at', key: 'created_at', width: 130, render: (d: string) => <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span> },
    { title: '', key: 'action', width: 60, render: (_: any, r: User) => <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => handleDeleteUser(r.id, r.email)} /> },
  ]

  if (loading) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>User Management</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>Manage user accounts</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowForm(!showForm)} style={{ height: 32, fontSize: 13, borderRadius: 6 }}>
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: '0 0 16px 0' }}>Create New User</h3>
            <Form form={form} layout="vertical" onFinish={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Full Name</span>} name="fullName" rules={[{ required: true }]}>
                  <Input placeholder="John Doe" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>} name="email" rules={[{ required: true }, { type: 'email' }]}>
                  <Input placeholder="user@example.com" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Password</span>} name="password" rules={[{ required: true }, { min: 6 }]}>
                  <Input.Password placeholder="Min 6 characters" style={{ height: 40 }} />
                </Form.Item>
              </div>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting} style={{ height: 40, borderRadius: 6 }}>Create User</Button>
                  <Button style={{ height: 40, borderRadius: 6 }} onClick={() => { form.resetFields(); setShowForm(false) }}>Cancel</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
          <Table columns={columns} dataSource={users.map(u => ({ ...u, key: u.id }))} pagination={{ pageSize: 10 }} />
        </div>
      </div>
    </AppShell>
  )
}
