'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Table, Input, message, Tag, Card, Avatar, Modal, Form, Button } from 'antd'
import { Search, Mail, Phone, Briefcase, Users, Plus, Edit, Trash2, Building2 } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string | null
  position?: string | null
  department?: string | null
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

  const fetchContacts = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams()
      const search = searchQuery.trim()
      if (search) params.set('search', search)

      const response = await fetch(`/api/contact${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to load contacts')

      setContacts(result.contacts || [])
    } catch {
      message.error('Failed to load contacts')
    } finally {
      setTableLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth')
          return
        }

        const { data: userData } = await supabase
          .from('tbl_users')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single()

        setIsAdmin(userData?.role === 'admin')
        setUser({ id: session.user.id, email: session.user.email || '', role: userData?.role || 'user' })
        setLoading(false)
      } catch {
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router, setUser, setIsAdmin, setLoading])

  useEffect(() => {
    if (!user) return

    const timeout = setTimeout(fetchContacts, searchQuery.trim() ? 250 : 0)
    return () => clearTimeout(timeout)
  }, [fetchContacts, searchQuery, user])

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return contacts

    return contacts.filter(contact => [
      contact.name,
      contact.email,
      contact.phone,
      contact.position,
      contact.department
    ].some(value => value?.toLowerCase().includes(query)))
  }, [contacts, searchQuery])

  const handleAdd = () => {
    setEditingContact(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    form.setFieldsValue(contact)
    setModalVisible(true)
  }

  const handleDelete = async (contact: Contact) => {
    Modal.confirm({
      title: 'Delete Contact',
      content: `Remove ${contact.name || contact.email} from the employee directory?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No active session')

          const response = await fetch(`/api/contact?id=${contact.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed to delete contact')

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const payload = {
        id: editingContact?.id,
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        phone: values.phone?.trim() || null,
        position: values.position?.trim() || null,
        department: values.department?.trim() || null
      }

      const response = await fetch('/api/contact', {
        method: editingContact ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save contact')

      message.success(editingContact ? 'Contact updated' : 'Contact added')
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
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Contact) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar style={{ backgroundColor: '#3b82f6' }}>
            {(text?.[0] || record.email?.[0] || 'U').toUpperCase()}
          </Avatar>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{text || 'N/A'}</div>
            {record.department && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{record.department}</div>
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
      dataIndex: 'position',
      key: 'position',
      render: (text: string) => text ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Briefcase size={14} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
        </div>
      ) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not specified</span>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => text ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Building2 size={14} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
        </div>
      ) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not specified</span>
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
              Phonebook-style directory for employee contact details
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              placeholder="Search name, email, phone, position or department..."
              prefix={<Search size={14} style={{ color: 'var(--text-tertiary)' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 360, height: 36 }}
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
            locale={{ emptyText: 'No employee contacts found' }}
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
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
              <Input placeholder="john@example.com" />
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Input placeholder="Engineering" />
            </Form.Item>
            <Form.Item name="position" label="Position">
              <Input placeholder="Software Engineer" />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="+1 (555) 123-4567" />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </AppShell>
  )
}
