'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Ticket,
  Inbox,
  CheckCircle2,
  Wallet,
  Receipt,
  Settings,
  Users,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

export type NavKey = 'dashboard' | 'ticket'

const groups = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
      { key: 'analytics', label: 'Analytics', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Tickets',
    items: [
      { key: 'all-tickets', label: 'All Tickets', icon: Ticket },
      { key: 'inbox', label: 'Inbox', icon: Inbox },
      { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { key: 'billing', label: 'Billing', icon: Wallet },
      { key: 'invoices', label: 'Invoices', icon: Receipt },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { key: 'users', label: 'Users', icon: Users },
      { key: 'roles', label: 'Roles & Access', icon: ShieldCheck },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function Sidebar({
  onNavigate,
  active,
}: {
  onNavigate: (key: NavKey) => void
  active: NavKey
}) {
  const [selected, setSelected] = useState<string>('dashboard')

  function handleClick(key: string) {
    setSelected(key)
    if (key === 'dashboard') onNavigate('dashboard')
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-line">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white text-sm font-bold">
          T
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink">Ticketing App</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  selected === item.key || (active === 'dashboard' && item.key === 'dashboard')
                return (
                  <button
                    key={item.key}
                    onClick={() => handleClick(item.key)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-soft text-brand'
                        : 'text-muted hover:bg-canvas hover:text-ink'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <div className="rounded-lg bg-canvas border border-line p-3">
          <p className="text-xs font-semibold text-ink">PV Advisory</p>
          <p className="text-[11px] text-muted mt-0.5">Enterprise plan · 24 seats</p>
        </div>
      </div>
    </aside>
  )
}
