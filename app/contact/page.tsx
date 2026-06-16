'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Table, Input, message, Tag, Card, Avatar, Modal, Form, Button } from 'antd'
import { Search, Mail, Phone, Briefcase, Users, Plus, Edit, Trash2 } from 'lucide-react'

interface Contact {
  id: string
  email: string
  full_name: string
  phone?: string
  job_title?: string
  role: string
  created_at: string
}

export default function ContactPage() {
  const router = useRouter()
  const { user, isAdmin, setUser, setIsAdmin, setLoading } = useAuthStore()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setTableLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }

        const { data: userData } = await supabase.from('tbl_users').select('id, email, full_name, role').eq('id', session.user.id).single()
        
        setIsAdmin(userData?.role === 'admin')
        setUser({ id: session.user.id, email: session.user.email || '', role: userData?.role || 'user' })
        setLoading(false)
        fetchContacts()
      } catch { router.push('/auth') }
    }
    checkAuth()
  }, [router, setUser, setIsAdmin, setLoading])

  const fetchContacts = async () => {
    try {
      const { data } = await supabase.from('tbl_users').select('id, email, full_name, phone, job_title, role, created_at').order('created_at', { ascending: false })
      setContacts(data || [])
    } catch { message.error('Failed to load contacts') }
    finally { setTableLoading(false) }
  }

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.full_name?.toLowerCase().includes(q) ||
           c.email.toLowerCase().includes(q) ||
           c.job_title?.toLowerCase().includes(q) ||
           c.phone?.includes(searchQuery)
  })

  const handleAdd = () => {
    setEditingContact(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    form.setFieldsValue({
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      job_title: contact.job_title,
    })
    setModalVisible(true)
  }

  const handleDelete = (contact: Contact) => {
    if (contact.id === user?.id) {
      message.error('Cannot delete your own account')
      return
    }
    
    Modal.confirm({
      title: 'Delete Contact',
      content: `Remove ${contact.full_name || contact.email} from contacts?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { error } = await supabase.from('tbl_users').delete().eq('id', contact.id)
          if (error) throw error
          message.success('Contact deleted')
          fetchContacts()
        } catch {
          message.error('Failed to delete contact')
        }
      }
    })
  }

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      if (editingContact) {
        const { error } = await supabase.from('tbl_users').update({
          full_name: values.full_name,
          phone: values.phone,
          job_title: values.job_title,
        }).eq('id', editingContact.id)
        if (error) throw error
        message.success('Contact updated')
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No session')
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ email: values.email, password: values.password, fullName: values.full_name })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to create user')
        message.success('User created')
      }
      setModalVisible(false)
      fetchContacts()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error saving contact')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: Contact) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar style={{ backgroundColor: record.role === 'admin' ? '#7c3aed' : '#3b82f6' }}>
            {(text?.[0] || record.email[0] || 'U').toUpperCase()}
          </Avatar>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{text || 'N/A'}</div>
            {record.id === user?.id && (
              <Tag color="blue" style={{ fontSize: 10, margin: '2px 0 0 0' }}>You</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={14} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
        </div>
      )
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Phone size={14} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
        </div>
      ) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not provided</span>
    },
    {
      title: 'Position',
      dataIndex: 'job_title',
      key: 'job_title',
      render: (text: string) => text ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Briefcase size={14} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
        </div>
      ) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not specified</span>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'purple' : 'blue'} style={{ fontWeight: 500 }}>
          {role === 'admin' ? 'Admin' : 'User'}
        </Tag>
      )
    },
    ...(isAdmin ? [{
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: Contact) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="text" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record)} />
          <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record)} />
        </div>
      )
    }] : [])
  ]

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>
              Employee Directory
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
              Contact information for all team members
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              placeholder="Search contacts..."
              prefix={<Search size={14} style={{ color: 'var(--text-tertiary)' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 240, height: 36 }}
              allowClear
            />
            {isAdmin && (
              <Button 
                type="primary" 
                icon={<Plus size={14} />} 
                onClick={handleAdd}
                style={{ height: 36, borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
              >
                Add Contact
              </Button>
            )}
            <Tag color="blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} />
              {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
            </Tag>
          </div>
        </div>

        <Card style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <Table
            columns={columns}
            dataSource={filteredContacts.map(c => ({ ...c, key: c.id }))}
            loading={loading}
            pagination={{ pageSize: 15 }}
            locale={{ emptyText: 'No contacts found' }}
          />
        </Card>

        <Modal
          title={editingContact ? 'Edit Contact' : 'Add New Contact'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
            <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            {!editingContact && (
              <>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                  <Input placeholder="john@example.com" />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                  <Input.Password placeholder="Password" />
                </Form.Item>
              </>
            )}
            <Form.Item name="phone" label="Phone">
              <Input placeholder="+1 (555) 123-4567" />
            </Form.Item>
            <Form.Item name="job_title" label="Position">
              <Input placeholder="Software Engineer" />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
                {editingContact ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </AppShell>
  )
}