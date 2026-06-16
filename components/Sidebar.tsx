'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import {
  Ticket,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Mail,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/admin/overview', label: 'Overview', icon: BarChart3, adminOnly: true },
  { href: '/tickets', label: 'Tickets', icon: Ticket, adminOnly: false },
  { href: '/contact', label: 'Contact', icon: Mail, adminOnly: false },
  { href: '/admin/users', label: 'User Management', icon: Users, adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  )

  const isActive = (href: string) => {
    if (pathname.startsWith(href)) return true
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
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
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
          borderBottom: '1px solid var(--border-subtle)',
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
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            PV Advisory
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
                backgroundColor: active ? 'var(--bg-sidebar-active)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                position: 'relative',
                transition: 'background-color 100ms, color 100ms',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
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
          borderTop: '1px solid var(--border-subtle)',
          padding: '8px 0',
          flexShrink: 0,
        }}
      >
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
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            width: collapsed ? 'calc(100% - 16px)' : 'calc(100% - 16px)',
            transition: 'background-color 100ms, color 100ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-tertiary)'
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

    </aside>
  )
}
