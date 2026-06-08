'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import Link from 'next/link'
import { Category, Priority, Status } from '@/lib/types'
import { Layout, Form, Input, Select, Button, message, Typography, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const categories: Category[] = ['Bug Report', 'Technical Issue', 'Account Inquiry', 'New Feature Request', 'Other']
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function NewTicketPage() {
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { addTicket } = useTicketStore()
  const [loading, setLocalLoading] = useState(false)
  const [form] = Form.useForm()

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

  const onFinish = async (values: {
    title: string
    description: string
    category: Category
    priority: Priority
    tags?: string
  }) => {
    if (!user) return

    const tags = values.tags
      ? values.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0 && t.length <= 50)
      : []

    if (tags.length > 10) {
      message.error('Maximum 10 tags allowed')
      return
    }

    setLocalLoading(true)
    try {
      const { data, error } = await supabase
        .from('tbl_tickets')
        .insert([
          {
            title: values.title.trim(),
            description: values.description.trim(),
            category: values.category,
            priority: values.priority,
            status: 'UNTOUCHED' as Status,
            tags: tags,
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        addTicket(data[0])
        message.success('Ticket created successfully!')
        router.push('/tickets')
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
      message.error('Failed to create ticket. Please try again.')
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
      <Content style={{ margin: '0 auto', maxWidth: '600px', padding: '40px 24px', width: '100%' }}>
        <Link href="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '24px' }}>
          <ArrowLeftOutlined />
          Back to tickets
        </Link>

        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '32px' }}>
          <Title level={3} style={{ color: '#fff', marginBottom: '24px', marginTop: 0 }}>Create New Ticket</Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              category: 'Bug Report',
              priority: 'MEDIUM',
              tags: '',
            }}
          >
            <Form.Item
              label={<span style={{ color: '#d1d5db' }}>Title</span>}
              name="title"
              rules={[
                { required: true, message: 'Please enter a title' },
                { max: 255, message: 'Title cannot exceed 255 characters' }
              ]}
            >
              <Input 
                placeholder="Brief title of the issue"
                size="large"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#d1d5db' }}>Description</span>}
              name="description"
              rules={[
                { required: true, message: 'Please enter a description' },
                { max: 5000, message: 'Description cannot exceed 5000 characters' }
              ]}
            >
              <TextArea
                placeholder="Detailed description of the issue"
                rows={5}
                size="large"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', resize: 'none' }}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                label={<span style={{ color: '#d1d5db' }}>Category</span>}
                name="category"
                rules={[{ required: true }]}
              >
                <Select 
                  size="large" 
                  popupMatchSelectWidth={false}
                  options={categories.map((cat) => ({
                    label: cat,
                    value: cat,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ color: '#d1d5db' }}>Priority</span>}
                name="priority"
                rules={[{ required: true }]}
              >
                <Select 
                  size="large" 
                  popupMatchSelectWidth={false}
                  options={priorities.map((p) => ({
                    label: p,
                    value: p,
                  }))}
                />
              </Form.Item>
            </div>

            <Form.Item
              label={<span style={{ color: '#d1d5db' }}>Tags</span>}
              name="tags"
              style={{ marginBottom: '8px' }}
            >
              <Input
                placeholder="Separate tags with commas (e.g. bug, website, urgent)"
                size="large"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              />
            </Form.Item>
            <div style={{ marginBottom: '24px' }}>
              <Text type="secondary" style={{ fontSize: '12px', color: '#9ca3af' }}>
                Separate multiple tags with commas
              </Text>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', display: 'flex' }} size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{ flex: 1, minWidth: '120px' }}
                >
                  Create Ticket
                </Button>
                <Link href="/tickets" style={{ flex: 1 }}>
                  <Button size="large" style={{ width: '100%', minWidth: '120px' }}>
                    Cancel
                  </Button>
                </Link>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  )
}
