'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Priority, Status, CategoryData, Tag } from '@/types/types'
import { Form, Input, Select, Button, message } from 'antd'
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
  const [fetchingData, setFetchingData] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          supabase.from('tbl_categories').select('*').order('name'),
          supabase.from('tbl_tags').select('*').order('name')
        ])
        if (catRes.data) setDbCategories(catRes.data)
        if (tagRes.data) setDbTags(tagRes.data)
      } catch (err) {
        console.error('Error fetching categories/tags:', err)
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

  const onFinish = async (values: { title: string; description: string; category: string; priority: Priority; tags?: string[] }) => {
    if (!user) return
    const tags = values.tags || []
    if (tags.length > 10) { message.error('Maximum 10 tags allowed'); return }
    
    setLocalLoading(true)
    try {
      // 1. Save any new tags to tbl_tags
      const existingTagNames = dbTags.map(t => t.name)
      const newTags = tags.filter(t => !existingTagNames.includes(t))
      
      if (newTags.length > 0) {
        await supabase.from('tbl_tags').insert(newTags.map(name => ({ name })))
      }

      // 2. Create the ticket
      const { data, error } = await supabase.from('tbl_tickets').insert([{ 
        title: values.title.trim(), 
        description: values.description.trim(), 
        category: values.category, 
        priority: values.priority, 
        status: 'UNTOUCHED' as Status, 
        tags, 
        user_id: user.id 
      }]).select()

      if (error) throw error
      if (data && data[0]) { 
        addTicket(data[0])
        message.success('Ticket created!')
        router.push('/tickets') 
      }
    } catch (err) { 
      console.error(err)
      message.error('Failed to create ticket') 
    } finally { 
      setLocalLoading(false) 
    }
  }

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px', maxWidth: 700, margin: '0 auto' }}>
        <Link href="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-link)', fontSize: 12, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to tickets
        </Link>

        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: '0 0 4px 0' }}>Create New Ticket</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '0 0 24px 0' }}>Submit a new support request</p>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 24 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ priority: 'MEDIUM' }}>
            <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Title</span>} name="title"
              rules={[{ required: true, message: 'Please enter a title' }, { max: 255, message: 'Max 255 characters' }]}>
              <Input placeholder="Brief title of the issue" style={{ height: 40 }} />
            </Form.Item>

            <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Description</span>} name="description"
              rules={[{ required: true, message: 'Please enter a description' }, { max: 5000, message: 'Max 5000 characters' }]}>
              <Input.TextArea placeholder="Detailed description of the issue" rows={5} style={{ resize: 'none' }} />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Category</span>} name="category" rules={[{ required: true }]}>
                <Select 
                  style={{ height: 40 }} 
                  loading={fetchingData}
                  placeholder="Select a category"
                  options={dbCategories.map((cat) => ({ label: cat.name, value: cat.name }))} 
                />
              </Form.Item>
              <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Priority</span>} name="priority" rules={[{ required: true }]}>
                <Select style={{ height: 40 }} options={priorities.map((p) => ({ label: p, value: p }))} />
              </Form.Item>
            </div>

            <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Tags</span>} name="tags">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Select or type tags"
                loading={fetchingData}
                options={dbTags.map(tag => ({ label: tag.name, value: tag.name }))}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="primary" htmlType="submit" loading={loading} style={{ height: 40, fontWeight: 600, borderRadius: 6, minWidth: 120 }}>Create Ticket</Button>
                <Link href="/tickets">
                  <Button style={{ height: 40, borderRadius: 6 }}>Cancel</Button>
                </Link>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </AppShell>
  )
}
