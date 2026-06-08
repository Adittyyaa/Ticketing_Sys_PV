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

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * NavigationHeader Component
 * Top navigation bar with logo, actions, and user menu
 * Features:
 * - Company logo with clickable home link
 * - Admin dashboard quick access (for admins only)
 * - Notifications button with badge
 * - Account details modal trigger
 * - User menu with email, role, and logout
 */
export default function NavigationHeader() {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const { user, setUser, isAdmin } = useAuthStore() // Get user info and admin status
  const router = useRouter()
  const [showAccountModal, setShowAccountModal] = useState(false)

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle user logout
   * Signs out from Supabase and redirects to auth page
   */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth')
  }

  // ============================================
  // DROPDOWN MENU CONFIGURATION
  // ============================================

  /**
   * User dropdown menu items
   * Shows: Email, Role badge, Logout option
   */
  const menuItems = [
    {
      key: 'email',
      disabled: true, // Display only (not clickable)
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
      type: 'divider' as const, // Visual separator
    },
    {
      key: 'role',
      disabled: true, // Display only
      label: (
        <div style={{ fontSize: '12px' }}>
          <Badge 
            color={isAdmin ? '#722ed1' : '#1890ff'} // Purple for admin, blue for user
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
      danger: true, // Red styling
      onClick: handleLogout,
    } as const,
  ]

  // ============================================
  // RENDER
  // ============================================

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
        {/* ============================================ */}
        {/* LEFT SECTION: Logo */}
        {/* ============================================ */}
        <Link 
          href={isAdmin ? '/admin' : '/tickets'} // Admin goes to admin dashboard, users to tickets
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
        >
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={40} 
            height={40} 
            style={{ borderRadius: '8px' }}
          />
          {/* Title hidden on mobile, shown on larger screens */}
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: '600', display: 'none', marginLeft: '12px' }}>
            Ticket System
          </span>
        </Link>

        {/* ============================================ */}
        {/* RIGHT SECTION: Navigation Actions */}
        {/* ============================================ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Admin Dashboard Link (only visible to admins) */}
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

          {/* Notifications Button */}
          <Tooltip title="Notifications">
            <Button 
              type="text"
              icon={<Badge count={0} offset={[-5, 5]}><BellOutlined /></Badge>} // Badge shows notification count
              size="large"
              style={{ color: '#fff' }}
            />
          </Tooltip>

          {/* Account Details Button */}
          <Tooltip title="Account">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => setShowAccountModal(true)}
              size="large"
              style={{ color: '#fff' }}
            />
          </Tooltip>

          {/* User Menu Dropdown */}
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

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}
      
      {/* Account Details Modal - Opens when user clicks account button */}
      <AccountDetailsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </>
  )
}
