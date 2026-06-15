'use client'

import { Popover, Empty } from 'antd'
import { Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AccountDetailsModal from './AccountDetailsModal'
import ThemeToggle from './ThemeToggle'

export default function TopBar() {
  const { user, isAdmin } = useAuthStore()
  const router = useRouter()
  const [showAccountModal, setShowAccountModal] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const notificationContent = (
    <div style={{ width: 280 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
        Notifications
      </div>
      <div style={{ padding: '24px 0' }}>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No new notifications</span>} 
        />
      </div>
    </div>
  )

  return (
    <>
      <header
        style={{
          height: 56,
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12,
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Theme Toggle */}
        <ThemeToggle size="middle" />

        {/* Notifications */}
        <Popover 
          content={notificationContent} 
          trigger="click" 
          placement="bottomRight"
          overlayInnerStyle={{ padding: 0 }}
        >
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <Bell size={18} />
          </button>
        </Popover>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* User Profile Info */}
        {user && (
          <div
            onClick={() => setShowAccountModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>
                {user.email}
              </div>
              <div style={{ color: 'var(--accent-primary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>
                {isAdmin ? 'Admin' : 'User'}
              </div>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isAdmin ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0,
              }}
            >
              <span style={{ color: isAdmin ? '#fff' : 'var(--accent-primary)', fontSize: 14, fontWeight: 700 }}>
                {(user.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </header>

      <AccountDetailsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </>
  )
}

