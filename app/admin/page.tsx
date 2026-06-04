'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import TicketTable from '@/components/TicketTable'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import ExportButton from '@/components/ExportButton'
import { Ticket } from '@/lib/types'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const { setTickets, filters } = useTicketStore()
  const [activeTab, setActiveTab] = useState<'my' | 'others'>('my')
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [otherTickets, setOtherTickets] = useState<Ticket[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push('/auth')
          return
        }

        // Check if user is admin - use service role to bypass RLS if needed
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single()

        console.log('Admin check - User data:', userData, 'Error:', error)

        if (error) {
          console.error('User data fetch error:', error)
          console.log('Trying to fetch without RLS...')
          router.push('/tickets')
          return
        }

        if (!userData || userData.role !== 'admin') {
          console.log('Not admin, redirecting. Role:', userData?.role)
          router.push('/tickets')
          return
        }

        // User is admin
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'admin',
        })
        setIsAdmin(true)
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  useEffect(() => {
    if (!user || !isAdmin) return

    const fetchAllTickets = async () => {
      try {
        let query = supabase.from('tickets').select('*').order('created_at', { ascending: false })

        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) throw error

        const allTickets = (data || []) as Ticket[]
        
        // Separate tickets into "my tickets" and "other tickets"
        const my = allTickets.filter(ticket => ticket.user_id === user.id)
        const others = allTickets.filter(ticket => ticket.user_id !== user.id)
        
        setMyTickets(my)
        setOtherTickets(others)
        setTickets(allTickets)
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      }
    }

    fetchAllTickets()
  }, [user, isAdmin, filters.search, setTickets])

  if (!user || !isAdmin) {
    return null
  }

  const displayedTickets = activeTab === 'my' ? myTickets : otherTickets

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <div className="bg-blue-900/20 border-b border-blue-700 px-6 py-3">
        <p className="text-blue-300 text-sm">ADMIN DASHBOARD - Managing all tickets</p>
      </div>
      <FilterBar />
      <main className="max-w-6xl mx-auto p-6">
        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between border-b border-slate-700">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-3 font-medium transition-colors relative ${
                  activeTab === 'my'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                My Tickets
                <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded text-xs">
                  {myTickets.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('others')}
                className={`px-6 py-3 font-medium transition-colors relative ${
                  activeTab === 'others'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Other Tickets
                <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded text-xs">
                  {otherTickets.length}
                </span>
              </button>
            </div>
            <div className="flex gap-3 mb-2">
              <ExportButton tickets={displayedTickets} />
              <Link href="/admin/users" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                Add User
              </Link>
            </div>
          </div>
        </div>

        {/* Ticket Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {activeTab === 'my' ? 'Tickets Raised by Me' : 'Tickets Raised by Other Users'}
          </h2>
          <TicketTable tickets={displayedTickets} />
          {displayedTickets.length === 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400">No tickets found in this category</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
