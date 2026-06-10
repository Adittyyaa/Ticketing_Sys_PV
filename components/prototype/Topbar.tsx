'use client'

import { Search, Bell, Settings, LogOut } from 'lucide-react'

export function Topbar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-surface/90 backdrop-blur px-4 lg:px-6">
      {/* Branding + env pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white text-sm font-bold">
            T
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink">
            PV Advisory
          </span>
          <span className="rounded-md border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
            Enterprise
          </span>
        </div>
      </div>

      {/* Center search */}
      <div className="flex flex-1 justify-center px-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Search tickets..."
            className="h-9 w-full rounded-lg border border-line bg-canvas pl-9 pr-16 text-sm text-ink placeholder:text-faint outline-none focus:border-brand focus:bg-surface"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          aria-label="Settings"
        >
          <Settings className="h-[18px] w-[18px]" />
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
            SB
          </div>
          <span className="hidden sm:block text-sm font-medium text-ink">Saurav Bhandari</span>
        </div>
      </div>
    </header>
  )
}
