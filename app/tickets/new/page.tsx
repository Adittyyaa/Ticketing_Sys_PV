'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Priority, CategoryData, Tag, TicketType, CustomStatus } from '@/types/types'
import { CATEGORIES } from '@/lib/constants'
import { Form, Input, Select, Button, message, Row, Col, Card } from 'antd'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAdminAuthHeader } from '@/lib/admin-api'

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const products = ['Pay-Ally', 'Comp-ally', 'Other']

export default function NewTicketPage() {
  const router = useRouter()
  const { user, setUser, setLoading, setIsAdmin } = useAuthStore()
  const { addTicket } = useTicketStore()
  const [loading, setLocalLoading] = useState(false)
  const [form] = Form.useForm()

  const [dbCategories, setDbCategories] = useState<CategoryData[]>([])
  const [dbTags, setDbTags] = useState<Tag[]>([])
  const [dbTypes, setDbTypes] = useState<TicketType[]>([])
  const [dbUsers, setDbUsers] = useState<{ id: string; email: string; full_name?: string }[]>([])
  const [dbStatuses, setDbStatuses] = useState<CustomStatus[]>([])
  const [fetchingData, setFetchingData] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeader = await getAdminAuthHeader()
        const [catRes, tagRes, typeRes, usersRes, statusRes] = await Promise.all([
          fetch('/api/admin/categories', { headers: { Authorization: authHeader } }),
          fetch('/api/admin/tags', { headers: { Authorization: authHeader } }),
          fetch('/api/admin/ticket-types', { headers: { Authorization: authHeader } }),
          fetch('/api/admin/users', { headers: { Authorization: authHeader } }),
          fetch('/api/admin/custom-statuses', { headers: { Authorization: authHeader } })
        ])

        const [catData, tagData, typeData, usersData, statusData] = await Promise.all([
          catRes.json(),
          tagRes.json(),
          typeRes.json(),
          usersRes.json(),
          statusRes.json()
        ])

        if (catData.categories) setDbCategories(catData.categories)
        else setDbCategories(CATEGORIES.map((c, i) => ({ id: i.toString(), name: c as string, color: '#6B7280', created_at: '' })))
        if (tagData.tags) setDbTags(tagData.tags)
        if (typeData.types) setDbTypes(typeData.types)
        if (usersData.users) setDbUsers(usersData.users)
        if (statusData.statuses) setDbStatuses(statusData.statuses)
      } catch (err) {
        console.error('Error fetching data:', err)
        setDbCategories(CATEGORIES.map((c, i) => ({ id: i.toString(), name: c as string, color: '#6B7280', created_at: '' })))
      } finally {
        setFetchingData(false)
      }
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { method: 'GET' })
        if (!response.ok) { router.push('/auth'); return }

        const { userId } = await response.json()
        const userResponse = await fetch('/api/admin/users/me', { method: 'GET' })
        const { user: userData } = await userResponse.json()
        const isAdmin = userData?.role === 'admin'

        setUser({ id: userId, email: userData?.email || '', full_name: userData?.full_name || '', role: userData?.role || 'user' })
        setLoading(false)
        setIsAdmin(isAdmin)
        setIsAdminUser(isAdmin)
        fetchData()
      } catch { router.push('/auth') }
    }
    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  const onFinish = async (values: {
    title: string;
    description: string;
    category: string;
    type?: string;
    product: string;
    product_reference_number?: string;
    priority: Priority;
    status: string;
    tags?: string[];
    assigned_to?: string;
  }) => {
    if (!user) {
      message.error('No user session found. Please log in again.')
      return
    }

    if (!values.product) {
      message.error('Please select a product')
      return
    }

    const tags = values.tags || []
    if (tags.length > 10) { message.error('Maximum 10 tags allowed'); return }

    setLocalLoading(true)
    try {
      const authHeader = await getAdminAuthHeader()

      const ticketData: any = {
        title: values.title.trim(),
        description: values.description.trim(),
        category_id: values.category, // This should be category ID now
        type_id: values.type || null,  // This should be type ID now
        product: values.product,
        product_reference_number: values.product_reference_number?.trim() || null,
        priority: values.priority,
        tags,
        user_id: user.id
      }

      if (isAdminUser && values.assigned_to) {
        ticketData.assigned_to = values.assigned_to
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(ticketData)
      })

      const result = await response.json()

      if (!response.ok) {
        message.error(`Failed to create ticket: ${result.error || 'Unknown error'}`)
        return
      }

      if (result.ticket) {
        addTicket(result.ticket)
        message.success('Ticket created!')
        router.push('/tickets')
      }
    } catch (err: any) {
      message.error(`Failed to create ticket: ${err?.message || 'Unknown error'}`)
    } finally {
      setLocalLoading(false)
    }
  }

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '32px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <Link href="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-link)', fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to tickets
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 600, margin: '0 0 8px 0' }}>Create New Ticket</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>Submit a new support request with detailed information</p>
        </div>

        <Card style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ priority: 'MEDIUM', status: 'UNTOUCHED' }}>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Title</span>}
                  name="title"
                  rules={[{ required: true, message: 'Please enter a title' }, { max: 255, message: 'Max 255 characters' }]}
                >
                  <Input placeholder="Brief title of the issue" size="large" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Description</span>}
                  name="description"
                  rules={[{ required: true, message: 'Please enter a description' }, { max: 5000, message: 'Max 5000 characters' }]}
                >
                  <Input.TextArea placeholder="Detailed description of the issue" rows={6} style={{ resize: 'none' }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Category</span>}
                  name="category"
                  rules={[{ required: true, message: 'Please select a category' }]}
                >
                  <Select
                    size="large"
                    loading={fetchingData}
                    placeholder="Select a category"
                    options={dbCategories.map((cat) => ({ label: cat.name, value: cat.id }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Type</span>}
                  name="type"
                >
                  <Select
                    size="large"
                    loading={fetchingData}
                    placeholder="Select ticket type (optional)"
                    allowClear
                    options={dbTypes.map((type) => ({ label: type.name, value: type.id }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Product</span>}
                  name="product"
                  rules={[{ required: true, message: 'Please select a product' }]}
                >
                  <Select
                    size="large"
                    placeholder="Select product"
                    options={products.map((product) => ({ label: product, value: product }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Status</span>}
                  name="status"
                  rules={[{ required: true, message: 'Please select a status' }]}
                  initialValue="UNTOUCHED"
                >
                  <Select
                    size="large"
                    loading={fetchingData}
                    placeholder="Select status"
                    options={dbStatuses.length > 0
                      ? dbStatuses.map(s => ({ label: s.name, value: s.name }))
                      : [
                          { label: 'Untouched', value: 'UNTOUCHED' },
                          { label: 'Pending', value: 'PENDING' },
                          { label: 'Opened', value: 'OPENED' },
                          { label: 'Solved', value: 'SOLVED' },
                        ]
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Priority</span>}
                  name="priority"
                  rules={[{ required: true, message: 'Please select a priority' }]}
                  initialValue="MEDIUM"
                >
                  <Select
                    size="large"
                    options={priorities.map((p) => ({
                      label: p,
                      value: p
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Product Reference Number</span>}
                  name="product_reference_number"
                >
                  <Input placeholder="e.g., PRD-2024-001 (optional)" size="large" />
                </Form.Item>
              </Col>

              {isAdminUser && (
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Assign To</span>}
                    name="assigned_to"
                  >
                    <Select
                      size="large"
                      loading={fetchingData}
                      placeholder="Select user to assign (optional)"
                      allowClear
                      options={dbUsers.map((u) => ({
                        label: u.full_name || u.email,
                        value: u.id
                      }))}
                    />
                  </Form.Item>
                </Col>
              )}

              <Col span={24}>
                <Form.Item
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Tags</span>}
                  name="tags"
                >
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Select or type tags (max 10)"
                    loading={fetchingData}
                    options={dbTags.map(tag => ({ label: tag.name, value: tag.name }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{ fontWeight: 600, minWidth: 140 }}
                >
                  Create Ticket
                </Button>
                <Link href="/tickets">
                  <Button size="large">Cancel</Button>
                </Link>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </AppShell>
  )
}