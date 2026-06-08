'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import NavigationHeader from '@/components/Header'
import { Layout, Table, Form, Input, Button, message, Modal, Tag, Space, Card, Typography } from 'antd'
import { Plus, Trash2 } from 'lucide-react'

const { Content } = Layout
const { Title } = Typography

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
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      message.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (values: any) => {
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session. Please login again.')
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create user')

      message.success('User created successfully!')
      form.resetFields()
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error creating user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete the user account for ${email}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase.from('tbl_users').delete().eq('id', userId)
          if (error) throw error
          message.success('User deleted successfully')
          fetchUsers()
        } catch (err) {
          message.error('Error deleting user')
        }
      }
    })
  }

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string) => <span className="text-white font-medium">{text || 'N/A'}</span>,
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
      width: 120,
      render: (role: string) => {
        const isUserAdmin = role === 'admin'
        return (
          <Tag color={isUserAdmin ? 'purple' : 'blue'}>
            {isUserAdmin ? 'Administrator' : 'User'}
          </Tag>
        )
      },
    },
    {
      title: 'Joined Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => (
        <span className="text-slate-400 text-sm">
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: User) => (
        <Button
          type="text"
          danger
          icon={<Trash2 size={16} />}
          onClick={() => handleDeleteUser(record.id, record.email)}
        />
      ),
    },
  ]

  if (loading) return null

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      <NavigationHeader />
      <Content style={{ margin: '0 auto', maxWidth: '1200px', padding: '40px 24px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>User Management</Title>
            <p className="text-slate-400 mt-1">Manage and create regular user accounts</p>
          </div>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            size="large"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>

        {showForm && (
          <Card 
            style={{ 
              backgroundColor: '#111827', 
              borderColor: '#374151', 
              marginBottom: '24px',
              borderRadius: '8px'
            }}
          >
            <Title level={4} style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>Create New User</Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateUser}
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
                    placeholder="user@example.com"
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
                  >
                    Create User
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

        <Card 
          style={{ 
            backgroundColor: '#111827', 
            borderColor: '#374151',
            borderRadius: '8px'
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={users.map(u => ({ ...u, key: u.id }))}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <div className="text-slate-500 py-8">No users found</div> }}
          />
        </Card>
      </Content>
    </Layout>
  )
}
