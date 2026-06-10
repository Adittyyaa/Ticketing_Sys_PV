'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/prototype/Sidebar'
import { Topbar } from '@/components/prototype/Topbar'
import { DashboardView } from '@/components/prototype/DashboardView'
import { TicketDetailView } from '@/components/prototype/TicketDetailView'
import { LoginView } from '@/components/prototype/LoginView'

type View = 'login' | 'dashboard' | 'ticket'

export default function DemoPage() {
  const [view, setView] = useState<View>('login')

  return (
    <div className="min-h-screen bg-canvas">
      {view === 'login' ? (
        <LoginView onSignIn={() => setView('dashboard')} />
      ) : (
        <div className="flex min-h-screen">
          <Sidebar onNavigate={(k) => setView(k)} active={view === 'ticket' ? 'ticket' : 'dashboard'} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onLogout={() => setView('login')} />
            <main className="flex-1">
              {view === 'dashboard' && (
                <DashboardView onOpenTicket={() => setView('ticket')} />
              )}
              {view === 'ticket' && <TicketDetailView onBack={() => setView('dashboard')} />}
            </main>
          </div>
        </div>
      )}

      {/* Floating view switcher for previewing all screens */}
      <ViewSwitcher view={view} setView={setView} />
    </div>
  )
}

function ViewSwitcher({
  view,
  setView,
}: {
  view: View
  setView: (v: View) => void
}) {
  const options: { key: View; label: string }[] = [
    { key: 'login', label: 'Login' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'ticket', label: 'Ticket Detail' },
  ]
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-lg">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => setView(o.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              view === o.key ? 'bg-brand text-white' : 'text-muted hover:bg-canvas hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
