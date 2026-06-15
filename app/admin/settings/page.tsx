'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, Table, Button, Input, Modal, Form, Space, message, Popconfirm, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined, FolderOutlined, MessageOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { CategoryData, Tag, SavedReply } from '@/types/types'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAdmin, setUser, setLoading, setIsAdmin } = useAuthStore()
  const [activeTab, setActiveTab] = useState('categories')
  
  // States for data
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([])
  const [loading, setTableLoading] = useState(false)

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()

  const verifyAdminRole = async (userId: string) => {
    const { data: userData, error } = await supabase.from('tbl_users').select('role').eq('id', userId).single()
    if (error || userData?.role !== 'admin') return false
    return true
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }
        const isUserAdmin = await verifyAdminRole(session.user.id)
        if (!isUserAdmin) { router.push('/tickets'); return }
        setUser({ id: session.user.id, email: session.user.email || '', role: 'admin' })
        setIsAdmin(true)
        setLoading(false)
      } catch {
        router.push('/auth')
      }
    }
    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, activeTab])

  const fetchData = async () => {
    setTableLoading(true)
    try {
      if (activeTab === 'categories') {
        const { data, error } = await supabase.from('tbl_categories').select('*').order('name')
        if (error) throw error
        setCategories(data || [])
      } else if (activeTab === 'tags') {
        const { data, error } = await supabase.from('tbl_tags').select('*').order('name')
        if (error) throw error
        setTags(data || [])
      } else if (activeTab === 'replies') {
        const { data, error } = await supabase.from('tbl_saved_replies').select('*').order('title')
        if (error) throw error
        setSavedReplies(data || [])
      }
    } catch {
      message.error(`Failed to load ${activeTab}`)
    } finally {
      setTableLoading(false)
    }
  }

  const showModal = (item: any = null) => {
    setEditingItem(item)
    if (item) {
      form.setFieldsValue(item)
    } else {
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setTableLoading(true)
      
      let table = ''
      if (activeTab === 'categories') table = 'tbl_categories'
      else if (activeTab === 'tags') table = 'tbl_tags'
      else if (activeTab === 'replies') table = 'tbl_saved_replies'

      if (editingItem) {
        const { error } = await supabase.from(table).update(values).eq('id', editingItem.id)
        if (error) throw error
        message.success(`${activeTab.slice(0, -1)} updated`)
      } else {
        const { error } = await supabase.from(table).insert([values])
        if (error) throw error
        message.success(`${activeTab.slice(0, -1)} added`)
      }
      
      setIsModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.code === '23505') {
        message.error('This name already exists')
      } else {
        message.error(`Failed to save ${activeTab.slice(0, -1)}`)
      }
    } finally {
      setTableLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setTableLoading(true)
    try {
      let table = ''
      if (activeTab === 'categories') table = 'tbl_categories'
      else if (activeTab === 'tags') table = 'tbl_tags'
      else if (activeTab === 'replies') table = 'tbl_saved_replies'

      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      message.success(`${activeTab.slice(0, -1)} deleted`)
      fetchData()
    } catch {
      message.error(`Failed to delete ${activeTab.slice(0, -1)}`)
    } finally {
      setTableLoading(false)
    }
  }

  const columns = {
    categories: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { 
        title: 'Actions', 
        key: 'actions', 
        width: 120,
        render: (_: any, record: any) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => showModal(record)} />
            <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ) 
      },
    ],
    tags: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { 
        title: 'Actions', 
        key: 'actions', 
        width: 120,
        render: (_: any, record: any) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => showModal(record)} />
            <Popconfirm title="Delete this tag?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ) 
      },
    ],
    replies: [
      { title: 'Title', dataIndex: 'title', key: 'title', width: 200 },
      { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true },
      { 
        title: 'Actions', 
        key: 'actions', 
        width: 120,
        render: (_: any, record: any) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => showModal(record)} />
            <Popconfirm title="Delete this reply?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ) 
      },
    ]
  }

  if (!user || !isAdmin) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, marginBottom: 24 }}>System Settings</h1>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'categories',
              label: (<span><FolderOutlined /> Categories</span>),
              children: (
                <Card>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Add Category</Button>
                  </div>
                  <Table 
                    dataSource={categories} 
                    columns={columns.categories} 
                    rowKey="id" 
                    loading={loading}
                    size="small"
                  />
                </Card>
              )
            },
            {
              key: 'tags',
              label: (<span><TagOutlined /> Tags</span>),
              children: (
                <Card>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Add Tag</Button>
                  </div>
                  <Table 
                    dataSource={tags} 
                    columns={columns.tags} 
                    rowKey="id" 
                    loading={loading}
                    size="small"
                  />
                </Card>
              )
            },
            {
              key: 'replies',
              label: (<span><MessageOutlined /> Saved Replies</span>),
              children: (
                <Card>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Add Saved Reply</Button>
                  </div>
                  <Table 
                    dataSource={savedReplies} 
                    columns={columns.replies} 
                    rowKey="id" 
                    loading={loading}
                    size="small"
                  />
                </Card>
              )
            }
          ]}
        />

        <Modal
          title={`${editingItem ? 'Edit' : 'Add'} ${activeTab.slice(0, -1)}`}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            {activeTab === 'replies' ? (
              <>
                <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                  <Input.TextArea rows={6} />
                </Form.Item>
              </>
            ) : (
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </AppShell>
  )
}
