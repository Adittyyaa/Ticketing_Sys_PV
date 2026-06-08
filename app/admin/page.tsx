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
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketError, setTicketError] = useState<string | null>(null)

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

        // Check if user is admin
        let { data: userData, error } = await supabase
          .from('tbl_users')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single()

        console.log('Admin check - Initial fetch:', { userData, error })

        // If user record doesn't exist, create it
        if (error?.code === 'PGRST116') {
          console.log('User record not found, creating profile...')
          const { data: newUser, error: createError } = await supabase
            .from('tbl_users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || '',
                role: 'user', // Default role, admin must be promoted manually
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (createError) {
            console.error('Failed to create user profile:', createError)
            router.push('/tickets')
            return
          }
          userData = newUser
          console.log('User profile created:', newUser)
        } else if (error) {
          console.error('User data fetch error:', error)
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

  const fetchAllTickets = async () => {
    if (!user || !isAdmin) return

    setIsLoadingTickets(true)
    setTicketError(null)

    try {
      console.log('Fetching tickets for admin user:', user.id)
      
      let query = supabase.from('tbl_tickets').select('*').order('created_at', { ascending: false })

      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query

      console.log('Ticket fetch response:', { data, error })

      if (error) {
        console.error('RLS or query error:', error)
        setTicketError(error.message)
        throw error
      }

      const allTickets = (data || []) as Ticket[]
      console.log('Total tickets fetched:', allTickets.length)
      
      // Separate tickets into "my tickets" and "other tickets"
      const my = allTickets.filter(ticket => ticket.user_id === user.id)
      const others = allTickets.filter(ticket => ticket.user_id !== user.id)
      
      console.log('My tickets:', my.length, 'Other tickets:', others.length)
      
      setMyTickets(my)
      setOtherTickets(others)
      setTickets(allTickets)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      setTicketError(error instanceof Error ? error.message : 'Failed to fetch tickets')
      // Don't let errors silently fail - log them
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack)
      }
    } finally {
      setIsLoadingTickets(false)
    }
  }

  useEffect(() => {
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
        {/* Error message if ticket fetching failed */}
        {ticketError && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            <p className="font-medium">Error loading tickets:</p>
            <p className="text-sm">{ticketError}</p>
            <p className="text-xs text-red-400 mt-2">Check browser console for more details.</p>
          </div>
        )}

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
              <Link href="/admin/manage-admins" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Admins
              </Link>
              <Link href="/admin/users" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
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
          {isLoadingTickets ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400">Loading tickets...</p>
            </div>
          ) : (
            <>
              <TicketTable tickets={displayedTickets} onTicketsDeleted={fetchAllTickets} />
              {displayedTickets.length === 0 && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400">No tickets found in this category</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
