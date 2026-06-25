'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, Table, Button, Input, Modal, Form, Space, message, Popconfirm, Card, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined, FolderOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { CategoryData, Tag, CustomStatus } from '@/types/types'
import { getAdminAuthHeader } from '@/lib/admin-api'
import { useTheme } from '@/contexts/ThemeContext'

const STATUS_COLORS = ['#64748b', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4']

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAdmin, setUser, setLoading, setIsAdmin } = useAuthStore()
  const [activeTab, setActiveTab] = useState('categories')
  const { zoom, changeZoom } = useTheme()
  
  // States for data
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([])
  const [loading, setTableLoading] = useState(false)

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { method: 'GET' })
        if (!response.ok) { router.push('/auth'); return }
        
        const authHeader = await getAdminAuthHeader()
        const userResponse = await fetch('/api/admin/users/me', {
          headers: { Authorization: authHeader }
        })
        if (!userResponse.ok) { router.push('/auth'); return }
        
        const { user: userData } = await userResponse.json()
        const isUserAdmin = userData?.role === 'admin'
        if (!isUserAdmin) { router.push('/tickets'); return }
        setUser({ id: userData.id, email: userData.email || '', full_name: userData.full_name || '', role: userData.role || 'admin' })
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
      const authHeader = await getAdminAuthHeader()
      if (activeTab === 'categories') {
        const response = await fetch('/api/admin/categories', { headers: { Authorization: authHeader } })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setCategories(result.categories || [])
      } else if (activeTab === 'tags') {
        const response = await fetch('/api/admin/tags', { headers: { Authorization: authHeader } })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setTags(result.tags || [])
      } else if (activeTab === 'statuses') {
        const response = await fetch('/api/admin/custom-statuses', { headers: { Authorization: authHeader } })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setCustomStatuses(result.statuses || [])
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
      const apiEndpoint = ''
      
      if (activeTab === 'categories') table = 'categories'
      else if (activeTab === 'tags') table = 'tags'
      else if (activeTab === 'statuses') table = 'custom-statuses'

      const authHeader = await getAdminAuthHeader()
      const endpoint = `/api/admin/${table}`
      
      if (editingItem) {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify({ id: editingItem.id, ...values })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        message.success(`${activeTab === 'statuses' ? 'Status' : activeTab.slice(0, -1)} updated`)
      } else {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify(values)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        message.success(`${activeTab === 'statuses' ? 'Status' : activeTab.slice(0, -1)} added`)
      }
      
      setIsModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.code === '23505') {
        message.error('This name already exists')
      } else {
        message.error(`Failed to save ${activeTab}`)
      }
    } finally {
      setTableLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setTableLoading(true)
    try {
      let endpoint = ''
      if (activeTab === 'categories') endpoint = '/api/admin/categories'
      else if (activeTab === 'tags') endpoint = '/api/admin/tags'
      else if (activeTab === 'statuses') endpoint = '/api/admin/custom-statuses'

      const url = new URL(endpoint, window.location.origin)
      url.searchParams.set('id', id)
      
      const authHeader = await getAdminAuthHeader()
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: { Authorization: authHeader }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      message.success(`${activeTab === 'statuses' ? 'Status' : activeTab.slice(0, -1)} deleted`)
      fetchData()
    } catch {
      message.error(`Failed to delete ${activeTab}`)
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
    statuses: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { 
        title: 'Color', 
        dataIndex: 'color', 
        key: 'color',
        width: 100,
        render: (color: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 16, backgroundColor: color, borderRadius: 4, border: '1px solid var(--border-subtle)' }} />
            <span style={{ fontSize: 12 }}>{color}</span>
          </div>
        )
      },
      { 
        title: 'Actions', 
        key: 'actions', 
        width: 120,
        render: (_: any, record: any) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => showModal(record)} />
            <Popconfirm title="Delete this status?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ) 
      },
    ]
  }

  const modalTitle = () => {
    if (editingItem) return `Edit ${activeTab === 'statuses' ? 'Status' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`
    return `Add ${activeTab === 'statuses' ? 'Status' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`
  }

  const renderForm = () => {
    if (activeTab === 'statuses') {
      return (
        <>
          <Form.Item name="name" label="Status Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., In Review" />
          </Form.Item>
          <Form.Item name="color" label="Color" rules={[{ required: true }]}>
            <Select
              style={{ width: '100%' }}
              options={STATUS_COLORS.map(c => ({ value: c, label: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 16, height: 16, backgroundColor: c, borderRadius: 4 }} />{c}</div> }))}
            />
          </Form.Item>
        </>
      )
    }
    return (
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
    )
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
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {categories.length === 0 && (
                      <Button onClick={async () => {
                        const authHeader = await getAdminAuthHeader()
                        const res = await fetch('/api/admin/seed', { method: 'POST', headers: { Authorization: authHeader } })
                        const data = await res.json()
                        if (res.ok) {
                          message.success(data.message)
                          fetchData()
                        } else {
                          message.error(data.error)
                        }
                      }}>Seed Default Categories</Button>
                    )}
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
              key: 'statuses',
              label: (<span><TagOutlined /> Custom Statuses</span>),
              children: (
                <Card>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Add Status</Button>
                  </div>
                  <Table 
                    dataSource={customStatuses} 
                    columns={columns.statuses} 
                    rowKey="id" 
                    loading={loading}
                    size="small"
                  />
                </Card>
              )
            },
            {
              key: 'appearance',
              label: (<span><SettingOutlined /> Appearance</span>),
              children: (
                <Card title="Display Settings">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>Interface Zoom</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12 }}>
                      Adjust the scale of the user interface elements. This setting will persist across page refreshes.
                    </div>
                    <Select
                      value={zoom}
                      onChange={changeZoom}
                      style={{ width: 200 }}
                      options={[
                        { label: '90% (Compact)', value: '90%' },
                        { label: '100% (Default)', value: '100%' },
                        { label: '110% (Large)', value: '110%' },
                        { label: '120% (Extra Large)', value: '120%' },
                        { label: '130% (Huge)', value: '130%' },
                      ]}
                    />
                  </div>
                </Card>
              )
            }
          ]}
        />

        <Modal
          title={modalTitle()}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            {renderForm()}
          </Form>
        </Modal>
      </div>
    </AppShell>
  )
}