'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { ShieldPlus, Trash2, Crown, User as UserIcon, CircleAlert as AlertCircle } from 'lucide-react'
import { Table, Form, Input, Button, message, Modal, Tag, Space } from 'antd'

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
  const [allUsers, setAllUsers] = useState<User[]>([])
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
      if (data) { setAdmins(data.filter(u => u.role === 'admin')); setAllUsers(data) }
    } catch { message.error('Failed to fetch users') }
    finally { setLoading(false) }
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
      message.success('Admin created!')
      form.resetFields()
      setShowForm(false)
      fetchUsers()
    } catch (err) { message.error(err instanceof Error ? err.message : 'Error creating admin') }
    finally { setSubmitting(false) }
  }

  const handleDeleteAdmin = async (userId: string, userName: string) => {
    if (userId === user?.id) { message.error('Cannot remove your own admin access'); return }
    Modal.confirm({
      title: 'Revoke Admin Access',
      content: `Remove admin access from ${userName}? Account becomes a regular user.`,
      okText: 'Revoke', okType: 'danger', cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase.from('tbl_users').update({ role: 'user' }).eq('id', userId)
          if (error) throw error
          message.success('Admin access revoked')
          fetchUsers()
        } catch { message.error('Error revoking admin') }
      }
    })
  }

  const columns = [
    { title: 'Name', dataIndex: 'full_name', key: 'full_name', render: (t: string, r: User) => (
      <Space><Crown size={14} style={{ color: '#a78bfa' }} /><span style={{ color: '#f0f4f8', fontWeight: 500 }}>{t}</span>{r.id === user?.id && <Tag color="blue">You</Tag>}</Space>
    )},
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t: string) => <span style={{ color: '#94a3b8' }}>{t}</span> },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 120, render: () => <Tag color="purple">Admin</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 130, render: (d: string) => <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span> },
    { title: '', key: 'actions', width: 60, render: (_: any, r: User) => r.id !== user?.id ? <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => handleDeleteAdmin(r.id, r.full_name)} /> : <span style={{ color: '#475569', fontSize: 11 }}>Current</span> },
  ]

  if (loading) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        {/* Admin Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: '#2e1065', borderRadius: 6, marginBottom: 20, borderLeft: '3px solid #a78bfa' }}>
          <Crown size={16} style={{ color: '#a78bfa' }} />
          <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 500 }}>ADMIN MANAGEMENT</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#f0f4f8', fontSize: 20, fontWeight: 600, margin: 0 }}>Admin Management</h1>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0 0' }}>Create and manage administrator accounts</p>
          </div>
          <Space>
            <Button style={{ height: 32, borderRadius: 6 }} onClick={() => router.push('/admin')}>Dashboard</Button>
            <Button type="primary" icon={<ShieldPlus size={14} />} onClick={() => setShowForm(!showForm)}
              style={{ height: 32, fontSize: 13, borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
              Create Admin
            </Button>
          </Space>
        </div>

        {showForm && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: '#f0f4f8', fontSize: 15, fontWeight: 600, margin: '0 0 16px 0' }}>Create New Admin Account</h3>
            <Form form={form} layout="vertical" onFinish={handleCreateAdmin}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Full Name</span>} name="fullName" rules={[{ required: true }]}>
                  <Input placeholder="John Doe" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Email</span>} name="email" rules={[{ required: true }, { type: 'email' }]}>
                  <Input placeholder="admin@company.com" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Password</span>} name="password" rules={[{ required: true }, { min: 6 }]}>
                  <Input.Password placeholder="Min 6 characters" style={{ height: 40 }} />
                </Form.Item>
              </div>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting} style={{ height: 40, borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>Create Admin Account</Button>
                  <Button style={{ height: 40, borderRadius: 6 }} onClick={() => { form.resetFields(); setShowForm(false) }}>Cancel</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { icon: <Crown size={20} style={{ color: '#a78bfa' }} />, value: admins.length, label: 'Total Admins', bg: '#2e1065' },
            { icon: <UserIcon size={20} style={{ color: '#60a5fa' }} />, value: allUsers.length - admins.length, label: 'Regular Users', bg: '#1e3a5f' },
            { icon: <UserIcon size={20} style={{ color: '#34d399' }} />, value: allUsers.length, label: 'Total Users', bg: '#064e3b' },
          ].map((card) => (
            <div key={card.label} style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                <div>
                  <div style={{ color: '#f0f4f8', fontSize: 22, fontWeight: 700 }}>{card.value}</div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, overflow: 'hidden' }}>
          <Table columns={columns} dataSource={admins.map(u => ({ ...u, key: u.id }))} pagination={{ pageSize: 10 }} />
        </div>

        {/* Info */}
        <div style={{ marginTop: 20, padding: 16, backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, display: 'flex', gap: 12 }}>
          <AlertCircle size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 500, margin: '0 0 4px 0' }}>Admin Account Guidelines</p>
            <ul style={{ color: '#94a3b8', fontSize: 12, listStyle: 'disc', listStylePosition: 'inside', margin: 0, padding: 0, lineHeight: 1.8 }}>
              <li>Admins have full access to all tickets and user management</li>
              <li>You cannot delete your own admin account</li>
              <li>Revoking admin access converts the account to a regular user</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
