'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Table, Form, Input, Button, message, Modal, Select, Tag, Spin } from 'antd'
import { Plus, Trash2, Users, Search, Edit } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuthStore()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoadingState] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form] = Form.useForm()
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editRoleForm] = Form.useForm()

  useEffect(() => {
    if (!isAdmin) { router.push('/tickets'); return }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('tbl_users').select('*').order('created_at', { ascending: false })
      setAllUsers(data || [])
    } catch { message.error('Failed to load users') }
    finally { setLoadingState(false) }
  }

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers
    const q = searchQuery.toLowerCase()
    return allUsers.filter(u => 
      u.email.toLowerCase().includes(q) || 
      (u.full_name || '').toLowerCase().includes(q)
    )
  }, [allUsers, searchQuery])

  const handleCreateUser = async (values: any) => {
    setSubmitting(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      let accessToken = session?.access_token
      if (!accessToken) throw new Error('No active session')
      
      const expiresAt = session?.expires_at
      if (expiresAt && expiresAt * 1000 - Date.now() < 60_000) {
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) throw refreshError
        accessToken = refreshedSession.session?.access_token
        if (!accessToken) throw new Error('No active session')
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ email: values.email, password: values.password, fullName: values.fullName, role: values.role }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create user')
      message.success('User created successfully!')
      form.resetFields()
      setShowForm(false)
      fetchUsers()
    } catch (err) { 
      message.error(err instanceof Error ? err.message : 'Error creating user') 
    }
    finally { setSubmitting(false) }
  }

  const handleUpdateRole = async (userId: string) => {
    try {
      const values = await editRoleForm.validateFields()
      const { error } = await supabase.from('tbl_users').update({ role: values.role }).eq('id', userId)
      if (error) throw error
      message.success('User role updated')
      setEditingUserId(null)
      fetchUsers()
    } catch (err) { 
      message.error('Failed to update role') 
    }
  }

  const handleDeleteUser = async (userId: string, email: string, userRole: string) => {
    if (userId === user?.id) {
      message.error('Cannot delete your own account')
      return
    }

    Modal.confirm({
      title: userRole === 'admin' ? 'Revoke Admin Access' : 'Delete User',
      content: userRole === 'admin' 
        ? `Remove admin access from ${email}? They will be converted to a regular user.`
        : `Delete ${email}? This cannot be undone.`,
      okText: userRole === 'admin' ? 'Revoke' : 'Delete', 
      okType: 'danger', 
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (userRole === 'admin') {
            const { error } = await supabase.from('tbl_users').update({ role: 'user' }).eq('id', userId)
            if (error) throw error
            message.success('Admin access revoked')
          } else {
            const { error } = await supabase.from('tbl_users').delete().eq('id', userId)
            if (error) throw error
            message.success('User deleted')
          }
          fetchUsers()
        } catch { 
          message.error(`Error ${userRole === 'admin' ? 'revoking admin' : 'deleting user'}`) 
        }
      }
    })
  }

  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'full_name', 
      key: 'full_name', 
      render: (t: string, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t || 'N/A'}</span>
          {record.id === user?.id && (
            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>You</Tag>
          )}
        </div>
      )
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email', 
      render: (t: string) => <span style={{ color: 'var(--text-secondary)' }}>{t}</span> 
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role', 
      width: 140, 
      render: (r: string, record: User) => {
        const isEditing = editingUserId === record.id
        return isEditing ? (
          <Form form={editRoleForm} layout="inline">
            <Form.Item name="role" initialValue={r} style={{ margin: 0 }}>
              <Select
                size="small"
                style={{ width: 100 }}
                options={[
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' }
                ]}
                onBlur={() => handleUpdateRole(record.id)}
                onChange={() => handleUpdateRole(record.id)}
              />
            </Form.Item>
          </Form>
        ) : (
          <Tag color={r === 'admin' ? 'purple' : 'blue'}>
            {r === 'admin' ? 'Admin' : 'User'}
          </Tag>
        )
      }
    },
    { 
      title: 'Joined', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      width: 130, 
      render: (d: string) => (
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          {new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      )
    },
    { 
      title: '', 
      key: 'action', 
      width: 80, 
      render: (_: any, r: User) => (
        r.id !== user?.id && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Button 
              type="text" 
              size="small"
              icon={<Edit size={14} />} 
              onClick={() => {
                setEditingUserId(r.id)
                editRoleForm.setFieldsValue({ role: r.role })
              }}
            />
            <Button 
              type="text" 
              danger 
              size="small"
              icon={<Trash2 size={14} />} 
              onClick={() => handleDeleteUser(r.id, r.email, r.role)}
            />
          </div>
        )
      )
    },
  ]

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}>
          <Spin size="large" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>
              User Management
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
              Manage all users and admins
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              placeholder="Search name or email..."
              prefix={<Search size={14} style={{ color: 'var(--text-tertiary)' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ width: 240, height: 32 }}
            />
            <Tag color="blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} />
              {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
            </Tag>
            <Button 
              type="primary" 
              icon={<Plus size={14} />} 
              onClick={() => setShowForm(!showForm)} 
              style={{ 
                height: 32, 
                fontSize: 13, 
                borderRadius: 6
              }}
            >
              {showForm ? 'Cancel' : 'Add User'}
            </Button>
          </div>
        </div>

        {showForm && (
          <div style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 8, 
            padding: 20, 
            marginBottom: 20 
          }}>
            <h3 style={{ 
              color: 'var(--text-primary)', 
              fontSize: 15, 
              fontWeight: 600, 
              margin: '0 0 16px 0' 
            }}>
              Create New User
            </h3>
            <Form form={form} layout="vertical" onFinish={handleCreateUser}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 16, 
                marginBottom: 16 
              }}>
                <Form.Item 
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Full Name</span>} 
                  name="fullName" 
                  rules={[{ required: true, message: 'Name is required' }]}
                >
                  <Input placeholder="John Doe" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item 
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Email</span>} 
                  name="email" 
                  rules={[
                    { required: true, message: 'Email is required' }, 
                    { type: 'email', message: 'Invalid email' }
                  ]}
                >
                  <Input placeholder="user@example.com" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item 
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Password</span>} 
                  name="password" 
                  rules={[
                    { required: true, message: 'Password is required' }, 
                    { min: 12, message: 'Minimum 12 characters' },
                    { pattern: /[A-Z]/, message: 'Must contain uppercase letter' },
                    { pattern: /[0-9]/, message: 'Must contain a number' },
                    { pattern: /[^A-Za-z0-9]/, message: 'Must contain special character' }
                  ]}
                >
                  <Input.Password placeholder="Min 12 chars, with A-Z, 0-9, and special char" style={{ height: 40 }} />
                </Form.Item>
                <Form.Item 
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Role</span>} 
                  name="role" 
                  rules={[{ required: true, message: 'Role is required' }]}
                  initialValue="user"
                >
                  <Select
                    style={{ height: 40 }}
                    options={[
                      { value: 'user', label: 'User' },
                      { value: 'admin', label: 'Admin' }
                    ]}
                  />
                </Form.Item>
              </div>
              <Form.Item style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={submitting} 
                    style={{ height: 40, borderRadius: 6 }}
                  >
                    Create User
                  </Button>
                  <Button 
                    style={{ height: 40, borderRadius: 6 }} 
                    onClick={() => { form.resetFields(); setShowForm(false) }}
                  >
                    Cancel
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        )}

        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 8, 
          overflow: 'hidden' 
        }}>
          <Table 
            columns={columns} 
            dataSource={filteredUsers.map(u => ({ ...u, key: u.id }))} 
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No user accounts found' }}
            onRow={(record) => ({
              onDoubleClick: () => {
                if (record.id !== user?.id) {
                  setEditingUserId(record.id)
                  editRoleForm.setFieldsValue({ role: record.role })
                }
              }
            })}
          />
        </div>
      </div>
    </AppShell>
  )
}