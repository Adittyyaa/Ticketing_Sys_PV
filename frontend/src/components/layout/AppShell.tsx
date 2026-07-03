'use client'

import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 240,
          minHeight: '100vh',
          transition: 'margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <TopBar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--bg-base)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

