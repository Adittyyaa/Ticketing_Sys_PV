'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Alert, Spin, Tag, Descriptions, message } from 'antd'
import { UserOutlined, PhoneOutlined, IdcardOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { format } from 'date-fns'

interface AccountDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

const COLORS = {
  modal: '#0f172a',
  input: '#1a2847',
  border: '#2d3e5f',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
}

export default function AccountDetailsModal({ isOpen, onClose }: AccountDetailsModalProps) {
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [joiningDate, setJoiningDate] = useState('')
  const [role, setRole] = useState('')
  const [isEditable, setIsEditable] = useState(true)

  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserData()
    }
  }, [isOpen, user?.id])

  const loadUserData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tbl_users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newUser, error: createError } = await supabase
            .from('tbl_users')
            .insert([{
              id: user.id,
              email: user.email || '',
              full_name: '',
              role: 'user',
              created_at: new Date().toISOString(),
            }])
            .select()
            .single()

          if (createError) throw createError
          if (newUser) {
            form.setFieldsValue({
              full_name: newUser.full_name || '',
              phone: newUser.phone || '',
              job_title: newUser.job_title || '',
            })
            setJoiningDate(newUser.created_at)
            setRole(newUser.role)
          }
        } else {
          throw error
        }
      } else if (data) {
        form.setFieldsValue({
          full_name: data.full_name || '',
          phone: data.phone || '',
          job_title: data.job_title || '',
        })
        setJoiningDate(data.created_at)
        setRole(data.role)
        if (data.full_name || data.phone || data.job_title) {
          setIsEditable(false)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      message.error('Failed to load account details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    try {
      const values = await form.validateFields()
      setIsSaving(true)

      const { error: updateError } = await supabase
        .from('tbl_users')
        .update({
          full_name: values.full_name,
          phone: values.phone,
          job_title: values.job_title,
          company: 'PV Advisory',
        })
        .eq('id', user.id)

      if (updateError) {
        const { error: insertError } = await supabase
          .from('tbl_users')
          .insert([{
            id: user.id,
            email: user.email || '',
            full_name: values.full_name,
            phone: values.phone,
            job_title: values.job_title,
            company: 'PV Advisory',
            role: 'user',
          }])
        if (insertError) throw insertError
      }

      message.success('Account details saved successfully!')
      setIsEditable(false)
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else {
        console.error('Error saving account details:', error)
        message.error('Failed to save account details')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: COLORS.input,
    borderColor: COLORS.border,
    color: COLORS.text,
  }

  return (
    <Modal
      title={<span style={{ fontSize: '18px', fontWeight: '600', color: COLORS.text }}>Account Details</span>}
      open={isOpen}
      onCancel={onClose}
      width={650}
      footer={
        !isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={onClose} style={{ backgroundColor: COLORS.border, color: COLORS.text }}>Close</Button>
            {isEditable && <Button type="primary" onClick={handleSave} loading={isSaving} style={{ backgroundColor: COLORS.accent }}>Save Changes</Button>}
          </div>
        )
      }
      styles={{
        body: { backgroundColor: COLORS.modal, padding: '0' },
        header: { backgroundColor: COLORS.modal, borderBottom: `1px solid ${COLORS.border}` },
        footer: { backgroundColor: COLORS.modal, borderTop: `1px solid ${COLORS.border}` },
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Account Information</h3>
            <Descriptions bordered={false} column={1} size="small" style={{ backgroundColor: COLORS.input, borderRadius: '8px', overflow: 'hidden' }}>
              <Descriptions.Item label={<span style={{ color: COLORS.textMuted }}>Email</span>} labelStyle={{ backgroundColor: COLORS.input, borderColor: COLORS.border }} contentStyle={{ backgroundColor: COLORS.input, borderColor: COLORS.border }}>
                <span style={{ color: COLORS.text }}>{user?.email}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: COLORS.textMuted }}>Role</span>} labelStyle={{ backgroundColor: COLORS.input, borderColor: COLORS.border }} contentStyle={{ backgroundColor: COLORS.input, borderColor: COLORS.border }}>
                <Tag color={role === 'admin' ? 'purple' : 'cyan'} style={{ color: COLORS.text }}>{role === 'admin' ? 'Administrator' : 'User'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: COLORS.textMuted }}>Member Since</span>} labelStyle={{ backgroundColor: COLORS.input, borderColor: COLORS.border }} contentStyle={{ backgroundColor: COLORS.input, borderColor: COLORS.border }}>
                <span style={{ color: COLORS.text }}>{joiningDate && format(new Date(joiningDate), 'MMM d, yyyy')}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {!isEditable && (
            <Alert message={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircleOutlined /> Profile Locked</span>} description="Profile saved. Details are locked and cannot be changed." type="success" showIcon={false} style={{ backgroundColor: `${COLORS.success}15`, border: `1px solid ${COLORS.success}40`, color: COLORS.success, marginBottom: '24px', borderRadius: '6px' }} />
          )}

          <div>
            <h3 style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Personal Information</h3>
            <Form form={form} layout="vertical" disabled={!isEditable}>
              <Form.Item label={<span style={{ color: COLORS.text }}>Full Name</span>} name="full_name" rules={[{ required: isEditable, message: 'Please enter your full name' }]}>
                <Input prefix={<UserOutlined style={{ color: COLORS.textMuted }} />} placeholder="Enter your full name" size="large" style={inputStyle} className="professional-input" />
              </Form.Item>
              <Form.Item label={<span style={{ color: COLORS.text }}>Phone Number</span>} name="phone" rules={[{ required: isEditable, message: 'Please enter your phone number' }]}>
                <Input prefix={<PhoneOutlined style={{ color: COLORS.textMuted }} />} placeholder="+1 (555) 000-0000" size="large" style={inputStyle} className="professional-input" />
              </Form.Item>
              <Form.Item label={<span style={{ color: COLORS.text }}>Job Title</span>} name="job_title" rules={[{ required: isEditable, message: 'Please enter your job title' }]}>
                <Input prefix={<IdcardOutlined style={{ color: COLORS.textMuted }} />} placeholder="e.g., Senior Manager" size="large" style={inputStyle} className="professional-input" />
              </Form.Item>
              <Form.Item label={<span style={{ color: COLORS.text }}>Company</span>}>
                <Input prefix={<BankOutlined style={{ color: COLORS.textMuted }} />} value="PV Advisory" disabled size="large" style={{ ...inputStyle, color: COLORS.textMuted }} />
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </Modal>
  )
}