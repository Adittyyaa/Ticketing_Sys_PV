'use client'

import { Dropdown, Tooltip } from 'antd'
import { Bell, LogOut, User, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AccountDetailsModal from './AccountDetailsModal'

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
          <div style={{ fontSize: 10, color: '#64748b' }}>Signed in as</div>
          <div style={{ fontSize: 13, color: '#f0f4f8', fontWeight: 500, marginTop: 2 }}>
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
          backgroundColor: '#111827',
          borderBottom: '1px solid #1e2d45',
          gap: 8,
          flexShrink: 0,
          zIndex: 30,
        }}
      >
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
              color: '#94a3b8',
              cursor: 'pointer',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a2236'
              e.currentTarget.style.color = '#f0f4f8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#94a3b8'
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
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a2236'
              e.currentTarget.style.color = '#f0f4f8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#94a3b8'
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
              e.currentTarget.style.backgroundColor = '#1a2236'
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
                backgroundColor: isAdmin ? '#2e1065' : '#1e3a5f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: isAdmin ? '#a78bfa' : '#60a5fa', fontSize: 12, fontWeight: 600 }}>
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
