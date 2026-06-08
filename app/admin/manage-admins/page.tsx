'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import NavigationHeader from '@/components/Header'
import { ShieldPlus, Trash2, Crown, User as UserIcon, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Layout, Table, Form, Input, Button, message, Modal, Tag, Space, Card, Typography } from 'antd'

const { Content } = Layout
const { Title } = Typography

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
    if (!isAdmin) {
      router.push('/tickets')
      return
    }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('tbl_users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) {
        setAdmins(data.filter(u => u.role === 'admin'))
        setAllUsers(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      message.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (values: any) => {
    setSubmitting(true)

    try {
      // Get current user's session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create admin')

      message.success('Admin account created successfully!')
      form.resetFields()
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error creating admin account')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      message.error('You cannot delete your own admin account')
      return
    }

    Modal.confirm({
      title: 'Revoke Admin Access',
      content: `Are you sure you want to remove admin access from ${userName}? This action converts the account to a regular user.`,
      okText: 'Revoke',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('tbl_users')
            .update({ role: 'user' })
            .eq('id', userId)

          if (error) throw error

          message.success('Admin privileges revoked successfully')
          fetchUsers()
        } catch (err) {
          message.error('Error revoking admin privileges')
        }
      }
    })
  }

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: User) => (
        <Space>
          <div className="p-1.5 bg-purple-500/10 rounded-lg">
            <Crown className="text-purple-400" size={14} />
          </div>
          <span className="text-white font-medium">{text}</span>
          {record.id === user?.id && (
            <Tag color="blue">You</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => <span className="text-slate-300">{text}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: () => <Tag color="purple">Administrator</Tag>,
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => (
        <span className="text-slate-400 text-sm">
          {new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: User) => (
        record.id !== user?.id ? (
          <Button
            type="text"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDeleteAdmin(record.id, record.full_name)}
            title="Revoke Admin Access"
          />
        ) : (
          <span className="text-slate-500 text-sm">Current User</span>
        )
      ),
    },
  ]

  if (loading) return null

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      <NavigationHeader />
      
      {/* Admin Banner */}
      <div className="glass-light border-b border-purple-500/20 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Crown className="text-purple-400" size={20} />
          <p className="text-purple-300 text-sm font-medium">ADMIN MANAGEMENT - Manage Administrator Accounts</p>
        </div>
      </div>

      <Content style={{ margin: '0 auto', maxWidth: '1200px', padding: '40px 24px', width: '100%' }}>
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>Admin Management</Title>
            <p className="text-slate-400 mt-1">Create and manage administrator accounts with full system access</p>
          </div>
          <Space>
            <Link href="/admin">
              <Button size="large">← Dashboard</Button>
            </Link>
            <Button
              type="primary"
              icon={<ShieldPlus size={16} />}
              size="large"
              style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
              onClick={() => setShowForm(!showForm)}
            >
              Create Admin Account
            </Button>
          </Space>
        </div>

        {/* Create Admin Form */}
        {showForm && (
          <Card 
            style={{ 
              backgroundColor: '#111827', 
              borderColor: '#374151', 
              marginBottom: '24px',
              borderRadius: '8px'
            }}
          >
            <Title level={4} style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>Create New Admin Account</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateAdmin}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <Form.Item
                  label={<span style={{ color: '#d1d5db' }}>Full Name</span>}
                  name="fullName"
                  rules={[{ required: true, message: 'Please enter full name' }]}
                >
                  <Input 
                    placeholder="John Doe"
                    size="large"
                    style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: '#d1d5db' }}>Email Address</span>}
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Invalid email' }
                  ]}
                >
                  <Input 
                    placeholder="admin@pvadvisory.com"
                    size="large"
                    style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: '#d1d5db' }}>Password</span>}
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                >
                  <Input.Password 
                    placeholder="••••••••"
                    size="large"
                    style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  />
                </Form.Item>
              </div>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    size="large"
                    style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                  >
                    Create Admin Account
                  </Button>
                  <Button
                    size="large"
                    onClick={() => {
                      form.resetFields()
                      setShowForm(false)
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-light rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Crown className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{admins.length}</p>
                <p className="text-sm text-slate-400">Total Admins</p>
              </div>
            </div>
          </div>
          
          <div className="glass-light rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <UserIcon className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{allUsers.length - admins.length}</p>
                <p className="text-sm text-slate-400">Regular Users</p>
              </div>
            </div>
          </div>

          <div className="glass-light rounded-2xl p-6 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <UserIcon className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{allUsers.length}</p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <Card 
          style={{ 
            backgroundColor: '#111827', 
            borderColor: '#374151',
            borderRadius: '8px'
          }}
          bodyStyle={{ padding: 0 }}
          title={
            <span style={{ color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crown size={18} className="text-purple-400" />
              Current Administrators
            </span>
          }
        >
          <Table
            columns={columns}
            dataSource={admins.map(u => ({ ...u, key: u.id }))}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <div className="text-slate-500 py-8">No admins found</div> }}
          />
        </Card>

        {/* Info Box */}
        <Card 
          style={{ 
            backgroundColor: '#1e293b/30', 
            borderColor: '#3b82f6/20', 
            marginTop: '24px',
            borderRadius: '8px'
          }}
        >
          <div className="flex gap-3">
            <AlertCircle className="text-blue-400 flex-shrink-0" size={20} />
            <div className="text-sm text-slate-300">
              <p className="font-medium text-white mb-1">Admin Account Guidelines</p>
              <ul className="space-y-1 text-slate-400 list-disc list-inside">
                <li>Admins have full access to all tickets and user management</li>
                <li>Admin accounts should use strong passwords and enable 2FA when available</li>
                <li>You cannot delete your own admin account for security reasons</li>
                <li>Revoking admin access converts the account to a regular user</li>
              </ul>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}
