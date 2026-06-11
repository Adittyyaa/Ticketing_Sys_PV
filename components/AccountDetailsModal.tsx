'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Alert, Spin, Tag, message } from 'antd'
import { UserOutlined, PhoneOutlined, IdcardOutlined, BankOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

interface AccountDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountDetailsModal({ isOpen, onClose }: AccountDetailsModalProps) {
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [role, setRole] = useState('')
  const [isEditable, setIsEditable] = useState(true)

  useEffect(() => {
    if (isOpen && user?.id) loadUserData()
  }, [isOpen, user?.id])

  const loadUserData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('tbl_users').select('*').eq('id', user.id).single()
      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newUser, error: createError } = await supabase.from('tbl_users').insert([{ id: user.id, email: user.email || '', full_name: '', role: 'user', created_at: new Date().toISOString() }]).select().single()
          if (createError) throw createError
          if (newUser) { form.setFieldsValue({ full_name: newUser.full_name || '', phone: newUser.phone || '', job_title: newUser.job_title || '' }); setRole(newUser.role) }
        } else throw error
      } else if (data) {
        form.setFieldsValue({ full_name: data.full_name || '', phone: data.phone || '', job_title: data.job_title || '' })
        setRole(data.role)
        if (data.full_name || data.phone || data.job_title) setIsEditable(false)
      }
    } catch { message.error('Failed to load account details') }
    finally { setIsLoading(false) }
  }

  const handleSave = async () => {
    if (!user?.id) return
    try {
      const values = await form.validateFields()
      setIsSaving(true)
      const { error: updateError } = await supabase.from('tbl_users').update({ full_name: values.full_name, phone: values.phone, job_title: values.job_title, company: 'PV Advisory' }).eq('id', user.id)
      if (updateError) {
        const { error: insertError } = await supabase.from('tbl_users').insert([{ id: user.id, email: user.email || '', full_name: values.full_name, phone: values.phone, job_title: values.job_title, company: 'PV Advisory', role: 'user' }])
        if (insertError) throw insertError
      }
      message.success('Account details saved!')
      setIsEditable(false)
    } catch (error: any) {
      if (error.errorFields) message.error('Please fill in all required fields')
      else message.error('Failed to save account details')
    } finally { setIsSaving(false) }
  }

  const inputStyle = { height: 40, borderRadius: 6 }

  return (
    <Modal
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#f0f4f8' }}>Account Details</span>}
      open={isOpen}
      onCancel={onClose}
      width={560}
      footer={
        !isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose} style={{ borderRadius: 6 }}>Close</Button>
            {isEditable && <Button type="primary" onClick={handleSave} loading={isSaving} style={{ borderRadius: 6 }}>Save Changes</Button>}
          </div>
        )
      }
      styles={{
        body: { backgroundColor: '#111827', padding: 0 },
        header: { backgroundColor: '#111827', borderBottom: '1px solid #1e2d45' },
        footer: { backgroundColor: '#111827', borderTop: '1px solid #1e2d45' },
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
      ) : (
        <div style={{ padding: 24 }}>
          {/* Account Info */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Account Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: '10px 12px', backgroundColor: '#1a2236', borderRadius: 6 }}>
                <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
                <div style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 500, marginTop: 2 }}>{user?.email}</div>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: '#1a2236', borderRadius: 6 }}>
                <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</div>
                <div style={{ marginTop: 2 }}><Tag color={role === 'admin' ? 'purple' : 'blue'}>{role === 'admin' ? 'Administrator' : 'User'}</Tag></div>
              </div>
            </div>
          </div>

          {!isEditable && (
            <Alert message="Profile saved" description="Your details have been saved and are locked." type="success" showIcon={false} style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', marginBottom: 24, borderRadius: 6 }} />
          )}

          {/* Personal Info */}
          <div>
            <h4 style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Personal Information</h4>
            <Form form={form} layout="vertical" disabled={!isEditable}>
              <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Full Name</span>} name="full_name" rules={[{ required: isEditable, message: 'Required' }]}>
                <Input prefix={<UserOutlined style={{ color: '#475569' }} />} placeholder="Enter your full name" style={inputStyle} />
              </Form.Item>
              <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Phone Number</span>} name="phone" rules={[{ required: isEditable, message: 'Required' }]}>
                <Input prefix={<PhoneOutlined style={{ color: '#475569' }} />} placeholder="+1 (555) 000-0000" style={inputStyle} />
              </Form.Item>
              <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Job Title</span>} name="job_title" rules={[{ required: isEditable, message: 'Required' }]}>
                <Input prefix={<IdcardOutlined style={{ color: '#475569' }} />} placeholder="e.g., Senior Manager" style={inputStyle} />
              </Form.Item>
              <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Company</span>}>
                <Input prefix={<BankOutlined style={{ color: '#475569' }} />} value="PV Advisory" disabled style={{ ...inputStyle, color: '#64748b' }} />
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </Modal>
  )
}
