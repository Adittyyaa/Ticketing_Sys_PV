'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Layout, Card, Form, Input, Select, Button, Space, Row, Col, Typography } from 'antd'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import Link from 'next/link'
import { Category, Priority, Status } from '@/lib/types'

const { Content } = Layout
const { Title, Text } = Typography

const categories: Category[] = ['Bug Report', 'Technical Issue', 'Account Inquiry', 'New Feature Request', 'Other']
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function NewTicketPage() {
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { addTicket } = useTicketStore()
  const [loading, setLocalLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Bug Report' as Category,
    priority: 'MEDIUM' as Priority,
    tags: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push('/auth')
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Input validation
    if (!formData.title.trim() || formData.title.length > 255) {
      alert('Title must be between 1 and 255 characters')
      return
    }

    if (!formData.description.trim() || formData.description.length > 5000) {
      alert('Description must be between 1 and 5000 characters')
      return
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length <= 50)

    if (tags.length > 10) {
      alert('Maximum 10 tags allowed')
      return
    }

    setLocalLoading(true)
    try {
      const { data, error } = await supabase
        .from('tbl_tickets')
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            priority: formData.priority,
            status: 'UNTOUCHED' as Status,
            tags: tags,
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        addTicket(data[0])
        router.push('/tickets')
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
      alert('Failed to create ticket. Please try again.')
    } finally {
      setLocalLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      <Header />
      <Content style={{ margin: '0 auto', maxWidth: '800px', padding: '24px' }}>
        <Link href="/tickets" style={{ color: '#60a5fa', textDecoration: 'none', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} />
          Back to tickets
        </Link>

        <Card style={{ backgroundColor: '#111827', borderColor: '#374151' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>Create New Ticket</Title>

          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item label={<span style={{ color: '#cbd5e1' }}>Title</span>} required>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title of the issue"
                size="large"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              />
            </Form.Item>

            <Form.Item label={<span style={{ color: '#cbd5e1' }}>Description</span>} required>
              <Input.TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                placeholder="Detailed description of the issue"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span style={{ color: '#cbd5e1' }}>Category</span>} required>
                  <Select
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value as Category })}
                    size="large"
                    style={{ width: '100%' }}
                    dropdownStyle={{ backgroundColor: '#1f2937' }}
                  >
                    {categories.map((cat) => (
                      <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={{ color: '#cbd5e1' }}>Priority</span>} required>
                  <Select
                    value={formData.priority}
                    onChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                    size="large"
                    style={{ width: '100%' }}
                    dropdownStyle={{ backgroundColor: '#1f2937' }}
                  >
                    {priorities.map((p) => (
                      <Select.Option key={p} value={p}>{p}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<span style={{ color: '#cbd5e1' }}>Tags</span>}>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Separate tags with commas (e.g. bug, website, urgent)"
                size="large"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              />
              <Text style={{ color: '#9ca3af', fontSize: '12px' }}>Separate multiple tags with commas</Text>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{ flex: 1, width: '200px' }}
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </Button>
                <Link href="/tickets">
                  <Button size="large" style={{ width: '120px' }}>Cancel</Button>
                </Link>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  )
}
