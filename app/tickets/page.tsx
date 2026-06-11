'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spin, Input, Select, Button } from 'antd'
import { Plus, Search, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketTable from '@/components/TicketTable'
import TicketCardView from '@/components/TicketCardView'
import { Ticket } from '@/types/types'
import Link from 'next/link'

export default function TicketsPage() {
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { setTickets, filters } = useTicketStore()
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode] = useState<'card' | 'table'>('card')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }
        const { data: userData } = await supabase.from('tbl_users').select('id, email, full_name, role').eq('id', session.user.id).single()
        setUser({ id: session.user.id, email: session.user.email || '', role: userData?.role || 'user' })
        setLoading(false)
      } catch {
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
        const rawSearch = (filters.search?.trim() || searchQuery.trim() || '').replace(/[%;]/g, '').substring(0, 100)
        let query = supabase.from('tbl_tickets').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false })
        if (rawSearch && rawSearch.length >= 2) query = query.ilike('title', `%${rawSearch}%`)
        const { data, error } = await query
        if (error) throw error
        let tickets = (data || []) as Ticket[]

        if (statusFilter !== 'all') tickets = tickets.filter(t => t.status === statusFilter)
        if (priorityFilter !== 'all') tickets = tickets.filter(t => t.priority === priorityFilter)

        setMyTickets(tickets)
        setTickets((data || []) as Ticket[])
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllTickets()
  }, [user, filters.search, searchQuery, statusFilter, priorityFilter, setTickets])

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>My Tickets</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
              {myTickets.length} ticket{myTickets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/tickets/new">
            <Button type="primary" icon={<Plus size={14} />} style={{ height: 32, fontSize: 13, fontWeight: 500, borderRadius: 6 }}>
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <Input
            placeholder="Search my tickets..."
            prefix={<Search size={14} style={{ color: 'var(--text-placeholder)' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 260, height: 32 }}
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 130, height: 32 }}
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'Untouched', value: 'UNTOUCHED' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Opened', value: 'OPENED' },
              { label: 'Solved', value: 'SOLVED' },
            ]}
          />
          <Select value={priorityFilter} onChange={setPriorityFilter} style={{ width: 130, height: 32 }}
            options={[
              { label: 'All Priority', value: 'all' },
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Urgent', value: 'URGENT' },
            ]}
          />
          <div style={{ flex: 1 }} />
          <Button size="small" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery('') }} style={{ height: 32 }}>
            Reset
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Spin size="large" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: 16, fontSize: 13 }}>Loading tickets...</p>
          </div>
        ) : myTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <FileText size={48} style={{ color: 'var(--border-strong)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>No tickets found</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Create your first ticket to get started!</p>
          </div>
        ) : viewMode === 'card' ? (
          <TicketCardView tickets={myTickets} />
        ) : (
          <TicketTable tickets={myTickets} />
        )}
      </div>
    </AppShell>
  )
}
