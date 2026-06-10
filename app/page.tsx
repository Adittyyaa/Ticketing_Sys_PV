'use client'

import React, { useState } from 'react'
import { Layout, Sidebar, Navbar } from '@/components/LayoutComponents'
import AdminDashboard from '@/components/AdminDashboard'
import TicketDetail from '@/components/TicketDetail'
import LoginPage from '@/components/LoginPage'

type ViewType = 'login' | 'dashboard' | 'ticket-detail'

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <Layout>
      <Navbar onViewChange={setCurrentView} currentView={currentView} />
      <div style={{ display: 'flex' }}>
        <Sidebar onViewChange={setCurrentView} currentView={currentView} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {currentView === 'dashboard' && <AdminDashboard onSelectTicket={() => setCurrentView('ticket-detail')} />}
          {currentView === 'ticket-detail' && <TicketDetail onBack={() => setCurrentView('dashboard')} />}
        </main>
      </div>
    </Layout>
  )
}
