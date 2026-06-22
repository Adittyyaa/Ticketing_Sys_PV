'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Input, message, Tag, Card, Modal, Form, Button, Collapse, Empty, Select } from 'antd'
import { Search, Plus, Edit, Trash2, BookOpen, Lightbulb, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Solution } from '@/types/types'

const { Panel } = Collapse
const { Option } = Select

const CATEGORIES = [
  'General',
  'Authentication',
  'Database',
  'Permissions',
  'Frontend',
  'Backend',
  'Network',
  'Other'
]

export default function SolutionsPage() {
  const router = useRouter()
  const { user, isAdmin, setUser, setIsAdmin, setLoading } = useAuthStore()
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [fetching, setFetching] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const fetchSolutions = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (selectedCategory) params.set('category', selectedCategory)

      const response = await fetch(`/api/solutions${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to load solutions')

      setSolutions(result.solutions || [])
    } catch {
      message.error('Failed to load solutions')
    } finally {
      setFetching(false)
    }
  }, [searchQuery, selectedCategory])

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
        setUser({ id: session.user.id, email: session.user.email || '', full_name: userData?.full_name || '', role: userData?.role || 'user' })
        setLoading(false)
      } catch {
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router, setUser, setIsAdmin, setLoading])

  useEffect(() => {
    if (!user) return
    const timeout = setTimeout(fetchSolutions, searchQuery.trim() ? 250 : 0)
    return () => clearTimeout(timeout)
  }, [fetchSolutions, searchQuery, user])

  const handleAdd = () => {
    setEditingSolution(null)
    form.resetFields()
    form.setFieldsValue({ category: 'General' })
    setModalVisible(true)
  }

  const handleEdit = (e: React.MouseEvent, solution: Solution) => {
    e.stopPropagation()
    setEditingSolution(solution)
    form.setFieldsValue(solution)
    setModalVisible(true)
  }

  const handleDelete = (e: React.MouseEvent, solution: Solution) => {
    e.stopPropagation()
    Modal.confirm({
      title: 'Delete Solution',
      content: `Are you sure you want to delete "${solution.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No active session')

          const response = await fetch(`/api/solutions?id=${solution.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed to delete solution')

          message.success('Solution deleted')
          fetchSolutions()
        } catch {
          message.error('Failed to delete solution')
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
        id: editingSolution?.id,
        title: values.title?.trim(),
        description: values.description?.trim(),
        steps: values.steps?.trim(),
        category: values.category
      }

      const response = await fetch('/api/solutions', {
        method: editingSolution ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save solution')

      message.success(editingSolution ? 'Solution updated' : 'Solution added')
      setModalVisible(false)
      fetchSolutions()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error saving solution')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, margin: 0 }}>
              Common Solutions & FAQ
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '8px 0 0 0', maxWidth: 600 }}>
              Find step-by-step solutions for commonly encountered issues and questions. 
              Search by title, description or category.
            </p>
          </div>
          {isAdmin && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleAdd}
              style={{ height: 40, borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed', fontWeight: 500 }}
            >
              Add New Solution
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Input
            placeholder="Search solutions by keywords..."
            prefix={<Search size={16} style={{ color: 'var(--text-tertiary)' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, height: 42, borderRadius: 8 }}
            allowClear
          />
          <Select
            placeholder="Category"
            style={{ width: 200, height: 42 }}
            allowClear
            onChange={setSelectedCategory}
            value={selectedCategory}
          >
            {CATEGORIES.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
        </div>

        {fetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-subtle)', borderTopColor: '#7c3aed', borderRadius: '50%' }}></div>
          </div>
        ) : solutions.length > 0 ? (
          <Collapse 
            expandIconPosition="end" 
            ghost 
            style={{ backgroundColor: 'transparent' }}
            className="solutions-collapse"
          >
            {solutions.map((solution) => (
              <Panel 
                header={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100% - 24px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 8, borderRadius: 8, color: '#7c3aed' }}>
                        <Lightbulb size={20} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>{solution.title}</div>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>{solution.category}</Tag>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 8 }}>
                            Updated {new Date(solution.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                        <Button 
                          type="text" 
                          icon={<Edit size={16} />} 
                          onClick={(e) => handleEdit(e, solution)}
                          style={{ color: 'var(--text-tertiary)' }}
                        />
                        <Button 
                          type="text" 
                          danger 
                          icon={<Trash2 size={16} />} 
                          onClick={(e) => handleDelete(e, solution)}
                        />
                      </div>
                    )}
                  </div>
                } 
                key={solution.id}
                style={{ 
                  marginBottom: 16, 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '0 8px 16px 44px' }}>
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HelpCircle size={14} /> Problem Description
                    </h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                      {solution.description}
                    </p>
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 8, borderLeft: '4px solid #7c3aed' }}>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} /> Step-by-Step Solution
                    </h4>
                    <div style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {solution.steps}
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-subtle)' }}>
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {searchQuery || selectedCategory ? 'No solutions match your search filters' : 'No solutions have been added yet'}
                </span>
              } 
            />
            {isAdmin && !searchQuery && !selectedCategory && (
              <Button type="primary" onClick={handleAdd} style={{ marginTop: 16, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
                Create First Solution
              </Button>
            )}
          </Card>
        )}

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} style={{ color: '#7c3aed' }} />
              <span>{editingSolution ? 'Edit Solution' : 'Add New Solution'}</span>
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={700}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="title" label="Issue Title" rules={[{ required: true, message: 'Title is required' }]} style={{ flex: 1 }}>
                <Input placeholder="e.g., Unable to reset password" height={40} />
              </Form.Item>
              <Form.Item name="category" label="Category" rules={[{ required: true }]} style={{ width: 200 }}>
                <Select>
                  {CATEGORIES.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <Form.Item 
              name="description" 
              label="Problem Description" 
              rules={[{ required: true, message: 'Description is required' }]}
              tooltip="Briefly describe the error symptoms or the question being answered"
            >
              <Input.TextArea rows={3} placeholder="Describe the problem users are facing..." />
            </Form.Item>
            
            <Form.Item 
              name="steps" 
              label="Solution Steps" 
              rules={[{ required: true, message: 'Steps are required' }]}
              tooltip="Provide clear, numbered or bulleted steps to resolve the issue"
            >
              <Input.TextArea rows={8} placeholder="1. Go to settings...&#10;2. Click on security...&#10;3. Follow the prompts..." />
            </Form.Item>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button onClick={() => setModalVisible(false)} style={{ height: 40, borderRadius: 6 }}>Cancel</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting} 
                style={{ height: 40, borderRadius: 6, backgroundColor: '#7c3aed', borderColor: '#7c3aed', padding: '0 24px' }}
              >
                {editingSolution ? 'Update Solution' : 'Publish Solution'}
              </Button>
            </div>
          </Form>
        </Modal>

        <style jsx global>{`
          .solutions-collapse .ant-collapse-item {
            transition: all 0.2s ease;
          }
          .solutions-collapse .ant-collapse-item:hover {
            border-color: #7c3aed !important;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
          }
          .solutions-collapse .ant-collapse-header {
            padding: 16px 20px !important;
            align-items: center !important;
          }
          .solutions-collapse .ant-collapse-content-box {
            padding: 0 !important;
          }
        `}</style>
      </div>
    </AppShell>
  )
}
