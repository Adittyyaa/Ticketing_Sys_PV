'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Alert, Spin, Tag, Descriptions, Space, message } from 'antd'
import { UserOutlined, PhoneOutlined, IdcardOutlined, BankOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { format } from 'date-fns'

// ============================================
// TYPE DEFINITIONS
// ============================================

interface AccountDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * AccountDetailsModal Component
 * Displays and manages user account information
 * Features:
 * - View email, role, and join date (read-only)
 * - Edit full name, phone, job title (one-time only)
 * - Company field locked to "PV Advisory"
 * - Profile becomes read-only after first save
 */
export default function AccountDetailsModal({ isOpen, onClose }: AccountDetailsModalProps) {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [joiningDate, setJoiningDate] = useState('')
  const [role, setRole] = useState('')
  const [isEditable, setIsEditable] = useState(true) // Profile becomes non-editable after first save

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Load user data when modal opens
   */
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserData()
    }
  }, [isOpen, user?.id])

  // ============================================
  // API FUNCTIONS
  // ============================================

  /**
   * Load user profile data from database
   * Auto-creates user record if not exists
   */
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
          // User record doesn't exist - create it
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
        // Set form values
        form.setFieldsValue({
          full_name: data.full_name || '',
          phone: data.phone || '',
          job_title: data.job_title || '',
        })
        setJoiningDate(data.created_at)
        setRole(data.role)
        
        // Disable editing if user already has saved details
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

  /**
   * Save user profile data to database
   * Disables further editing after successful save
   */
  const handleSave = async () => {
    if (!user?.id) return

    try {
      const values = await form.validateFields()
      setIsSaving(true)

      // Try to update first
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
        // If update fails, try to insert
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
      setIsEditable(false) // Lock the form after save
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        message.error('Please fill in all required fields')
      } else {
        console.error('Error saving account details:', error)
        message.error('Failed to save account details')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      title="Account Details"
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={
        !isLoading && (
          <Space>
            <Button onClick={onClose}>
              Close
            </Button>
            {isEditable && (
              <Button 
                type="primary" 
                onClick={handleSave} 
                loading={isSaving}
              >
                Save Changes
              </Button>
            )}
          </Space>
        )
      }
      styles={{
        body: { backgroundColor: '#0f172a' },
        header: { backgroundColor: '#0f172a', borderBottom: '1px solid #334155' },
        footer: { backgroundColor: '#0f172a', borderTop: '1px solid #334155' },
      }}
    >
      {/* ============================================ */}
      {/* LOADING STATE */}
      {/* ============================================ */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* ============================================ */}
          {/* READ-ONLY INFORMATION */}
          {/* ============================================ */}
          <Descriptions 
            bordered 
            column={1}
            size="middle"
          >
            <Descriptions.Item label="Email">
              {user?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              {role === 'admin' ? (
                <Tag color="purple">Administrator</Tag>
              ) : (
                <Tag color="blue">User</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Member Since">
              {joiningDate && format(new Date(joiningDate), 'MMM d, yyyy')}
            </Descriptions.Item>
          </Descriptions>

          {/* ============================================ */}
          {/* PROFILE LOCKED MESSAGE */}
          {/* ============================================ */}
          {!isEditable && (
            <Alert
              message="Profile Locked"
              description="✓ Profile saved. Details are locked and cannot be changed."
              type="info"
              showIcon
            />
          )}

          {/* ============================================ */}
          {/* EDITABLE FORM */}
          {/* ============================================ */}
          <Form
            form={form}
            layout="vertical"
            disabled={!isEditable}
          >
            {/* Full Name */}
            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[{ required: isEditable, message: 'Please enter your full name' }]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="Enter your full name" 
                size="large"
                style={{ 
                  backgroundColor: '#1e293b', 
                  borderColor: '#334155', 
                  color: '#fff' 
                }}
                className="dark-input"
              />
            </Form.Item>

            {/* Phone Number */}
            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[{ required: isEditable, message: 'Please enter your phone number' }]}
            >
              <Input 
                prefix={<PhoneOutlined />}
                placeholder="+1 (555) 000-0000" 
                size="large"
                style={{ 
                  backgroundColor: '#1e293b', 
                  borderColor: '#334155', 
                  color: '#fff' 
                }}
                className="dark-input"
              />
            </Form.Item>

            {/* Job Title */}
            <Form.Item
              label="Job Title"
              name="job_title"
              rules={[{ required: isEditable, message: 'Please enter your job title' }]}
            >
              <Input 
                prefix={<IdcardOutlined />}
                placeholder="e.g., Software Engineer" 
                size="large"
                style={{ 
                  backgroundColor: '#1e293b', 
                  borderColor: '#334155', 
                  color: '#fff' 
                }}
                className="dark-input"
              />
            </Form.Item>

            {/* Company (Read-only) */}
            <Form.Item label="Company">
              <Input 
                prefix={<BankOutlined />}
                value="PV Advisory"
                disabled
                size="large"
                style={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  color: '#94a3b8' 
                }}
              />
            </Form.Item>
          </Form>
        </Space>
      )}
    </Modal>
  )
}
