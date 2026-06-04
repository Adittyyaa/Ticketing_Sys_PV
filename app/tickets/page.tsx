'use client'

import { useEffect } from 'react'
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
  const { tickets, setTickets, filters } = useTicketStore()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  useEffect(() => {
    if (!user) return

    const fetchTickets = async () => {
      try {
        let query = supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) throw error

        setTickets((data || []) as Ticket[])
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      }
    }

    fetchTickets()
  }, [user, filters.search, setTickets])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <FilterBar />
      <main className="p-6">
        <TicketTable tickets={tickets} />
      </main>
    </div>
  )
}
