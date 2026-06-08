'use client'

import { Layout, Button, Dropdown, Tooltip, Badge } from 'antd'
import { MenuOutlined, BellOutlined, UserOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import AccountDetailsModal from './AccountDetailsModal'

const { Header } = Layout

export default function NavigationHeader() {
  const { user, setUser, isAdmin } = useAuthStore()
  const router = useRouter()
  const [showAccountModal, setShowAccountModal] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth')
  }

  const menuItems = [
    {
      key: 'email',
      disabled: true,
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: '12px', color: '#999' }}>Logged in as</div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500', marginTop: '4px' }}>
            {user?.email}
          </div>
        </div>
      ),
    } as const,
    {
      type: 'divider' as const,
    },
    {
      key: 'role',
      disabled: true,
      label: (
        <div style={{ fontSize: '12px' }}>
          <Badge 
            color={isAdmin ? '#722ed1' : '#1890ff'} 
            text={isAdmin ? 'Administrator' : 'User'} 
          />
        </div>
      ),
    } as const,
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    } as const,
  ]

  return (
    <>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#111827',
          borderBottom: '1px solid #374151',
          padding: '0 24px',
          height: '64px',
        }}
      >
        {/* Logo Section */}
        <Link 
          href={isAdmin ? '/admin' : '/tickets'}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
        >
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={40} 
            height={40} 
            style={{ borderRadius: '8px' }}
          />
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: '600', display: 'none', marginLeft: '12px' }}>
            Ticket System
          </span>
        </Link>

        {/* Right Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <Link href="/admin">
              <Tooltip title="Admin Dashboard">
                <Button 
                  type="text" 
                  icon={<HomeOutlined />}
                  size="large"
                  style={{ color: '#fff' }}
                />
              </Tooltip>
            </Link>
          )}

          <Tooltip title="Notifications">
            <Button 
              type="text"
              icon={<Badge count={0} offset={[-5, 5]}><BellOutlined /></Badge>}
              size="large"
              style={{ color: '#fff' }}
            />
          </Tooltip>

          <Tooltip title="Account">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => setShowAccountModal(true)}
              size="large"
              style={{ color: '#fff' }}
            />
          </Tooltip>

          {/* User Menu */}
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button
              type="text"
              icon={<MenuOutlined />}
              size="large"
              style={{ color: '#fff' }}
            />
          </Dropdown>
        </div>
      </Header>

      {/* Account Details Modal */}
      <AccountDetailsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </>
  )
}
