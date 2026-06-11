'use client'

import { Dropdown, Tooltip } from 'antd'
import { Bell, LogOut, User, Settings } from 'lucide-react'
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

  const menuItems = [
    {
      key: 'email',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Signed in as</div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>
            {user?.email}
          </div>
        </div>
      ),
    },

    { type: 'divider' as const },
    {
      key: 'account',
      icon: <User size={14} />,
      label: 'Account',
      onClick: () => setShowAccountModal(true),
    },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: 'Sign out',
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <>
      <header
        style={{
          height: 48,
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 8,
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Theme Toggle */}
        <ThemeToggle size="middle" />

        {/* Notifications */}
        <Tooltip title="Notifications">
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
            <Bell size={16} />
          </button>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="Settings">
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
            <Settings size={16} />
          </button>
        </Tooltip>

        {/* User Menu */}
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: isAdmin ? 'var(--accent-primary)' : 'var(--bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: isAdmin ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                {(user?.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
          </button>
        </Dropdown>
      </header>

      <AccountDetailsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </>
  )
}

