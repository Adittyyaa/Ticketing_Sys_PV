'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { UserRole } from '@/types/types'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
      { href: '/tickets', label: 'My Tickets', icon: Ticket },
    ],
  },
  {
    label: 'Actions',
    items: [{ href: '/tickets/new', label: 'New Ticket', icon: PlusCircle }],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
      { href: '/admin/manage-admins', label: 'Manage Admins', icon: ShieldCheck, adminOnly: true },
    ],
  },
]

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: UserRole
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  const content = (
    <>
      <div className="flex h-16 items-center justify-between gap-2.5 border-b border-line px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
            T
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">Ticketing System</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-canvas lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => {
          const items = group.items.filter((i) => !i.adminOnly || role === 'admin')
          if (items.length === 0) return null
          return (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-soft text-brand'
                          : 'text-muted hover:bg-canvas hover:text-ink'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="text-xs font-semibold text-ink">PV Advisory</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {role === 'admin' ? 'Administrator workspace' : 'Support workspace'}
          </p>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-surface shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
