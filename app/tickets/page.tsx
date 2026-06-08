'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import TicketTable from '@/components/TicketTable'
import { Ticket } from '@/lib/types'

export default function TicketsPage() {
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { setTickets, filters } = useTicketStore()
  const [activeTab, setActiveTab] = useState<'my' | 'others'>('my')
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [otherTickets, setOtherTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

        // Get user role from database
        const { data: userData } = await supabase
          .from('tbl_users')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: userData?.role || 'user',
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  useEffect(() => {
    if (!user) return

    const fetchAllTickets = async () => {
      setIsLoading(true)
      try {
        // Sanitize search input
        const sanitizedSearch = filters.search?.trim().substring(0, 100) || ''

        // Fetch my tickets
        let myQuery = supabase
          .from('tbl_tickets')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (sanitizedSearch) {
          myQuery = myQuery.ilike('title', `%${sanitizedSearch}%`)
        }

        const { data: myData, error: myError } = await myQuery
        if (myError) throw myError

        setMyTickets((myData || []) as Ticket[])
        setTickets((myData || []) as Ticket[])

        // Fetch other users' tickets with pagination
        let othersQuery = supabase
          .from('tbl_tickets')
          .select('*', { count: 'exact' })
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (sanitizedSearch) {
          othersQuery = othersQuery.ilike('title', `%${sanitizedSearch}%`)
        }

        const { data: othersData, error: othersError } = await othersQuery
        
        // If there's an RLS error, it means user doesn't have permission to view others' tickets
        if (othersError) {
          console.log('Cannot fetch other tickets (expected for regular users):', othersError.message)
          setOtherTickets([])
        } else {
          setOtherTickets((othersData || []) as Ticket[])
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllTickets()
  }, [user, filters.search, setTickets])

  if (!user) {
    return null
  }

  const displayedTickets = activeTab === 'my' ? myTickets : otherTickets

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <FilterBar />
      <main className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center border-b border-slate-700">
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
        </div>

        {/* Ticket Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {activeTab === 'my' ? 'Tickets Raised by Me' : 'Tickets Raised by Other Users'}
          </h2>
          {isLoading ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400">Loading tickets...</p>
            </div>
          ) : (
            <>
              <TicketTable tickets={displayedTickets} />
              {displayedTickets.length === 0 && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400">
                    {activeTab === 'my' 
                      ? 'No tickets found. Create your first ticket!' 
                      : 'No other tickets available to view'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
