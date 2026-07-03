'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal, Input, Button, Spin, Badge, message } from 'antd'
import { User, Phone, Briefcase, Building2, Edit3 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { adminService } from '@/services'

interface AccountDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountDetailsModal({ isOpen, onClose }: AccountDetailsModalProps) {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [role, setRole] = useState('')
  const [isEditable, setIsEditable] = useState(true)
  const [formData, setFormData] = useState({ full_name: '', phone: '', job_title: '' })
  const [saved, setSaved] = useState(false)

  const loadUserData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const response = await adminService.getCurrentUser()
      const result = response.data as any
      
      if (response.success && result) {
        const data = result
        setFormData({ 
          full_name: data.full_name || '', 
          phone: data.phone || '', 
          job_title: data.job_title || '' 
        })
        setRole(data.role)
        if (data.full_name || data.phone || data.job_title) setIsEditable(false)
      }
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user?.id) {
      const timer = setTimeout(() => {
        loadUserData().catch(() => {})
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen, user?.id, loadUserData])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (saved) {
      timer = setTimeout(() => setSaved(false), 3000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [saved])

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      const response = await adminService.updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        job_title: formData.job_title,
        company: 'HelpDesk',
      })
      
      if (response.success) {
        setSaved(true)
        setIsEditable(false)
      } else {
        message.error(response.error || 'Failed to save profile')
      }
    } catch {
      // Handle error silently
    } finally {
      setIsSaving(false)
    }
  }

  const glassOverlayStyle: React.CSSProperties = {
    backdropFilter: 'blur(12px)',
    background: 'rgba(24, 24, 28, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  }

  if (isLoading) {
    return (
      <Modal open={isOpen} onCancel={onClose} footer={null} width={480} style={{ padding: 0 }}>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={480}
      style={{ ...glassOverlayStyle, borderRadius: 16 }}
      styles={{ body: { padding: 0 } }}
      closeIcon={false}
    >
      <div style={{ padding: 32 }}>
        {saved && (
          <div style={{
            position: 'absolute',
            top: -48,
            right: 32,
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: 999,
            fontSize: 12,
            color: '#fff',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
          }}>
            Profile saved
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: -0.5 }}>Account Details</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0 0' }}>Manage your profile information</p>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={28} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{user?.email}</div>
            <Badge count={role === 'admin' ? 'Admin' : 'User'}
              style={{
                backgroundColor: role === 'admin' ? '#8b5cf6' : '#3b82f6',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                height: 20,
                minWidth: 48,
                padding: '0 8px',
                borderRadius: 999,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Input
              prefix={<User size={16} style={{ color: '#94a3b8', marginRight: 8 }} />}
              placeholder="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!isEditable}
              style={{
                height: 48,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: 14,
                borderRadius: 12,
                paddingLeft: 40,
              }}
              styles={{
                input: { color: '#e2e8f0', fontSize: 14 },
                prefix: { color: '#94a3b8' },
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Input
              prefix={<Phone size={16} style={{ color: '#94a3b8', marginRight: 8 }} />}
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditable}
              style={{
                height: 48,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: 14,
                borderRadius: 12,
                paddingLeft: 40,
              }}
              styles={{
                input: { color: '#e2e8f0', fontSize: 14 },
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Input
              prefix={<Briefcase size={16} style={{ color: '#94a3b8', marginRight: 8 }} />}
              placeholder="Job Title"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              disabled={!isEditable}
              style={{
                height: 48,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: 14,
                borderRadius: 12,
                paddingLeft: 40,
              }}
              styles={{
                input: { color: '#e2e8f0', fontSize: 14 },
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Input
              prefix={<Building2 size={16} style={{ color: '#94a3b8', marginRight: 8 }} />}
              value="HelpDesk"
              disabled
              style={{
                height: 48,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                fontSize: 14,
                borderRadius: 12,
                paddingLeft: 40,
              }}
              styles={{
                input: { color: '#94a3b8', fontSize: 14 },
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            style={{
              height: 40,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Close
          </Button>
          {isEditable ? (
            <Button
              type="primary"
              onClick={handleSave}
              loading={isSaving}
              style={{
                height: 40,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
              }}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditable(true)}
              style={{
                height: 40,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
              }}
              icon={<Edit3 size={14} />}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
