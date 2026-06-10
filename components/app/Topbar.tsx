'use client'

import { Menu, Bell, LogOut } from 'lucide-react'

export function Topbar({
  email,
  role,
  onLogout,
  onMenu,
}: {
  email: string
  role: string
  onLogout: () => void
  onMenu: () => void
}) {
  const initials = email ? email.slice(0, 2).toUpperCase() : 'NA'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 md:flex">
        <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink">
          PV Advisory
        </span>
        <span className="rounded-md border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-medium capitalize text-brand">
          {role}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          aria-label="Log out"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
        <div className="ml-1 flex items-center gap-2.5 rounded-lg border border-line bg-canvas py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="hidden max-w-[160px] truncate text-sm font-medium text-ink sm:block">
            {email}
          </span>
        </div>
      </div>
    </header>
  )
}
