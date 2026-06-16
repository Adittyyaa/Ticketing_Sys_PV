'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Input, Select, Spin, Badge } from 'antd'
import { FileText, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketTable from '@/components/TicketTable'
import TicketCardView from '@/components/TicketCardView'
import TicketFilterDrawer from '@/components/TicketFilterDrawer'
import { Ticket } from '@/types/types'
import { getAdminAuthHeader } from '@/lib/admin-api'
import Link from 'next/link'

type ViewMode = 'card' | 'table'

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Untouched', value: 'UNTOUCHED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Opened', value: 'OPENED' },
  { label: 'Solved', value: 'SOLVED' },
]

const priorityOptions = [
  { label: 'All Priority', value: 'all' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

function filterTickets(tickets: Ticket[], search: string, status: string, priority: string) {
  const rawSearch = search.trim().replace(/[%;]/g, '').substring(0, 100).toLowerCase()

  return tickets
    .filter((ticket) => {
      if (status !== 'all' && ticket.status !== status) return false
      if (priority !== 'all' && ticket.priority !== priority) return false
      if (!rawSearch || rawSearch.length < 2) return true

      const searchableText = `${ticket.title} ${ticket.description} ${ticket.number}`.toLowerCase()
      return searchableText.includes(rawSearch)
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export default function TicketsPage() {
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const { setTickets, filters, setFilters } = useTicketStore()
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [otherTickets, setOtherTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdminLocal, setIsAdminLocal] = useState(isAdmin)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }

        const { data: userData } = await supabase.from('tbl_users').select('id, email, full_name, role').eq('id', session.user.id).single()
        const admin = userData?.role === 'admin'

        setIsAdmin(admin)
        setIsAdminLocal(admin)
        setUser({ id: session.user.id, email: session.user.email || '', role: userData?.role || 'user' })
        setLoading(false)
      } catch {
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchTickets = async () => {
      setIsLoading(true)
      setTicketError(null)

      try {
        const effectiveSearch = filters.search?.trim() || searchQuery.trim() || ''
        const rawSearch = effectiveSearch.replace(/[%;]/g, '').substring(0, 100)
        let tickets: Ticket[] = []

        if (isAdminLocal) {
          const authHeader = await getAdminAuthHeader()
          const response = await fetch('/api/admin/tickets', { headers: { Authorization: authHeader } })
          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch tickets')
          }

          tickets = (result.tickets || []) as Ticket[]
        } else {
          let query = supabase.from('tbl_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

          if (rawSearch && rawSearch.length >= 2) {
            query = query.ilike('title', `%${rawSearch}%`)
          }

          const { data, error } = await query
          if (error) throw error
          tickets = (data || []) as Ticket[]
        }

        // Extract unique categories and types
        const uniqueCategories = [...new Set(tickets.map(t => t.category).filter(Boolean))] as string[]
        const uniqueTypes = [...new Set(tickets.map(t => t.type).filter(Boolean))] as string[]
        setCategories(uniqueCategories)
        setTypes(uniqueTypes)

        const my = filterTickets(tickets.filter((ticket) => ticket.user_id === user.id), effectiveSearch, statusFilter, priorityFilter)
        const other = isAdminLocal ? filterTickets(tickets.filter((ticket) => ticket.user_id !== user.id), effectiveSearch, statusFilter, priorityFilter) : []

        if (cancelled) return

        setMyTickets(my)
        setOtherTickets(other)
        setTickets(tickets)
      } catch (error) {
        if (!cancelled) {
          setTicketError(error instanceof Error ? error.message : 'Failed to fetch tickets')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchTickets()

    return () => {
      cancelled = true
    }
  }, [user, isAdminLocal, filters.search, searchQuery, statusFilter, priorityFilter, setTickets])

  const resetFilters = () => {
    setFilters({ search: '' })
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setTypeFilter('all')
    setSearchQuery('')
  }

  const renderTicketSection = (title: string, tickets: Ticket[], emptyDescription: string) => (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 16px', marginBottom: 12, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <FileText size={48} style={{ color: 'var(--border-strong)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500, margin: '0 0 8px' }}>No tickets found</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>{emptyDescription}</p>
        </div>
      ) : viewMode === 'card' ? (
        <TicketCardView tickets={tickets} />
      ) : (
        <TicketTable tickets={tickets} />
      )}
    </section>
  )

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>Tickets</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
              {isAdminLocal ? 'My tickets and other tickets' : 'View and manage your tickets'}
            </p>
          </div>
          <Link href="/tickets/new">
            <Button type="primary" icon={<Plus size={14} />} style={{ height: 32, fontSize: 13, fontWeight: 500, borderRadius: 6 }}>
              New Ticket
            </Button>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <Input
            placeholder="Search tickets..."
            prefix={<Search size={14} style={{ color: 'var(--text-placeholder)' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 260, height: 32 }}
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 130, height: 32 }}
            options={statusOptions}
          />
          <Select value={priorityFilter} onChange={setPriorityFilter} style={{ width: 130, height: 32 }}
            options={priorityOptions}
          />
          <div style={{ flex: 1 }} />
          <Badge 
            count={[searchQuery, statusFilter !== 'all', priorityFilter !== 'all', categoryFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length} 
            offset={[-5, 5]}
          >
            <Button 
              icon={<SlidersHorizontal size={14} />} 
              size="middle"
              onClick={() => setFilterDrawerOpen(true)}
              type={[searchQuery, statusFilter !== 'all', priorityFilter !== 'all', categoryFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length > 0 ? 'primary' : 'default'}
              style={{ height: 32 }}
            >
              Filters
            </Button>
          </Badge>
          <Button size="small" onClick={resetFilters} style={{ height: 32 }}>
            Reset
          </Button>
        </div>

        {ticketError && <Alert message="Error loading tickets" description={ticketError} type="error" style={{ margin: '16px 0', borderRadius: 6 }} showIcon closable />}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Spin size="large" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: 16, fontSize: 13 }}>Loading tickets...</p>
          </div>
        ) : (
          <>
            {renderTicketSection('My Tickets', myTickets, isAdminLocal ? 'You do not have any tickets yet.' : 'Create your first ticket to get started.')}
            {isAdminLocal && renderTicketSection('Other Tickets', otherTickets, 'No other tickets are available.')}
          </>
        )}

        {/* Filter Drawer */}
        <TicketFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          categoryFilter={categoryFilter}
          typeFilter={typeFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onCategoryChange={setCategoryFilter}
          onTypeChange={setTypeFilter}
          categories={categories}
          types={types}
          onApply={() => {}}
          onReset={resetFilters}
        />
      </div>
    </AppShell>
  )
}
