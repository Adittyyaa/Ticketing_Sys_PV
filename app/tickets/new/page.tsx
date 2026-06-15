'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Priority, Status, CategoryData, Tag, TicketType } from '@/types/types'
import { Form, Input, Select, Button, message, Row, Col, Card } from 'antd'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function NewTicketPage() {
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { addTicket } = useTicketStore()
  const [loading, setLocalLoading] = useState(false)
  const [form] = Form.useForm()
  
  const [dbCategories, setDbCategories] = useState<CategoryData[]>([])
  const [dbTags, setDbTags] = useState<Tag[]>([])
  const [dbTypes, setDbTypes] = useState<TicketType[]>([])
  const [fetchingData, setFetchingData] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes, typeRes] = await Promise.all([
          supabase.from('tbl_categories').select('*').order('name'),
          supabase.from('tbl_tags').select('*').order('name'),
          supabase.from('tbl_ticket_types').select('*').order('name')
        ])
        if (catRes.data) setDbCategories(catRes.data)
        if (tagRes.data) setDbTags(tagRes.data)
        if (typeRes.data) setDbTypes(typeRes.data)
      } catch (err) {
        console.error('Error fetching categories/tags/types:', err)
      } finally {
        setFetchingData(false)
      }
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }
        setUser({ id: session.user.id, email: session.user.email || '' })
        setLoading(false)
        fetchData()
      } catch { router.push('/auth') }
    }
    checkAuth()
  }, [setUser, setLoading, router])

  const onFinish = async (values: { 
    title: string; 
    description: string; 
    category: string; 
    type?: string;
    product_reference_number?: string;
    priority: Priority; 
    tags?: string[] 
  }) => {
    if (!user) {
      message.error('No user session found. Please log in again.')
      return
    }

    console.log('=== TICKET CREATION DEBUG ===')
    console.log('User from store:', user)
    console.log('Form values:', values)
    
    const tags = values.tags || []
    if (tags.length > 10) { message.error('Maximum 10 tags allowed'); return }
    
    setLocalLoading(true)
    try {
      // 1. Ensure user exists in tbl_users
      console.log('Step 1: Checking if user exists in tbl_users...')
      const { data: userData, error: userCheckError } = await supabase
        .from('tbl_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (userCheckError || !userData) {
        console.log('Step 1b: User not found, creating user record...')
        const { error: userInsertError } = await supabase
          .from('tbl_users')
          .insert([{
            id: user.id,
            email: user.email,
            role: 'user'
          }])
        
        if (userInsertError) {
          console.error('Failed to create user record:', userInsertError)
          message.error(`User setup error: ${userInsertError.message}`)
          return
        }
      }

      // 2. Save any new tags to tbl_tags
      const existingTagNames = dbTags.map(t => t.name)
      const newTags = tags.filter(t => !existingTagNames.includes(t))
      
      if (newTags.length > 0) {
        console.log('Step 2: Inserting new tags:', newTags)
        await supabase.from('tbl_tags').insert(newTags.map(name => ({ name })))
      }

      // 3. Create the ticket
      console.log('Step 3: Creating ticket...')
      const ticketData = { 
        title: values.title.trim(), 
        description: values.description.trim(), 
        category: values.category,
        type: values.type || null,
        product_reference_number: values.product_reference_number?.trim() || null,
        priority: values.priority, 
        status: 'UNTOUCHED' as Status, 
        tags, 
        user_id: user.id 
      }
      console.log('Ticket data to insert:', ticketData)

      const { data, error } = await supabase.from('tbl_tickets').insert([ticketData]).select()

      if (error) {
        console.error('Ticket creation error:', error)
        message.error(`Failed to create ticket: ${error.message}`)
        return
      }
      
      if (data && data[0]) { 
        console.log('✅ Ticket created successfully!')
        addTicket(data[0])
        message.success('Ticket created!')
        router.push('/tickets') 
      }
    } catch (err: any) { 
      console.error('Unexpected error:', err)
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
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ priority: 'MEDIUM' }}>
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
                    options={dbCategories.map((cat) => ({ label: cat.name, value: cat.name }))} 
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
                    options={dbTypes.map((type) => ({ label: type.name, value: type.name }))} 
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item 
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Priority</span>} 
                  name="priority" 
                  rules={[{ required: true, message: 'Please select a priority' }]}
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
