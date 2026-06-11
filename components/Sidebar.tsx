'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { href: '/tickets', label: 'Tickets', icon: Ticket, adminOnly: false },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { href: '/admin/manage-admins', label: 'Admins', icon: Shield, adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isAdmin, user } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  )

  const isActive = (href: string) => {
    if (href === '/admin' && pathname === '/admin') return true
    if (href !== '/admin' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
        backgroundColor: '#0b0f1a',
        borderRight: '1px solid #1e2d45',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), min-width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid #1e2d45',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={28}
          height={28}
          style={{ borderRadius: 6, flexShrink: 0 }}
        />
        {!collapsed && (
          <span
            style={{
              color: '#f0f4f8',
              fontSize: 15,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Helpdesk
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '8px 0',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {filteredItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '8px 16px' : '8px 20px',
                margin: '0 8px',
                borderRadius: 6,
                backgroundColor: active ? '#1a2236' : 'transparent',
                color: active ? '#f0f4f8' : '#94a3b8',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                position: 'relative',
                transition: 'background-color 100ms, color 100ms',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#141b2d'
                  e.currentTarget.style.color = '#f0f4f8'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div
        style={{
          borderTop: '1px solid #1e2d45',
          padding: '8px 0',
          flexShrink: 0,
        }}
      >
        {/* User Info */}
        {user && !collapsed && (
          <div
            style={{
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
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
                flexShrink: 0,
              }}
            >
              <span style={{ color: isAdmin ? '#a78bfa' : '#60a5fa', fontSize: 12, fontWeight: 600 }}>
                {(user.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#f0f4f8', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <div style={{ color: isAdmin ? '#a78bfa' : '#60a5fa', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>
                {isAdmin ? 'Admin' : 'User'}
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            padding: collapsed ? '8px 16px' : '8px 20px',
            margin: '0 8px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            width: collapsed ? 'calc(100% - 16px)' : 'calc(100% - 16px)',
            transition: 'background-color 100ms, color 100ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#141b2d'
            e.currentTarget.style.color = '#94a3b8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
