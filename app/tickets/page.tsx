'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Input, Spin, Badge, Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import { FileText, Plus, Search, SlidersHorizontal, ArrowUpDown, Check, LayoutGrid, Mail, Table as TableIcon, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketTable from '@/components/TicketTable'
import TicketCardView from '@/components/TicketCardView'
import TicketInboxView from '@/components/TicketInboxView'
import TicketFilterDrawer from '@/components/TicketFilterDrawer'
import { Ticket, CustomStatus } from '@/types/types'
import { getAdminAuthHeader } from '@/lib/admin-api'
import Link from 'next/link'

type ViewMode = 'card' | 'inbox' | 'table'
type SortField = 'created_at' | 'updated_at' | 'priority' | 'status' | 'number'
type SortOrder = 'asc' | 'desc'

function sortTickets(tickets: Ticket[], field: SortField, order: SortOrder, customStatuses: CustomStatus[] = []): Ticket[] {
  const sorted = [...tickets].sort((a, b) => {
    let comparison = 0

    switch (field) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        break
      case 'priority':
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
        break
      case 'status': {
        const statusOrder: Record<string, number> = { UNTOUCHED: 1, PENDING: 2, OPENED: 3, SOLVED: 4 }
        customStatuses.forEach((s, i) => {
          if (!(s.name in statusOrder)) statusOrder[s.name] = 5 + i
        })
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
        break
      }
      case 'number':
        comparison = (a.number || 0) - (b.number || 0)
        break
    }

    return order === 'asc' ? comparison : -comparison
  })

  return sorted
}

function filterTickets(
  tickets: Ticket[],
  search: string,
  status: string,
  priority: string,
  category: string,
  type: string,
  customStatuses: CustomStatus[] = []
) {
  const rawSearch = search.trim().replace(/[%;]/g, '').substring(0, 100).toLowerCase()

  return tickets.filter((ticket) => {
    if (status !== 'all' && !customStatuses.some(s => s.name === status) && ticket.status !== status) return false
    if (priority !== 'all' && ticket.priority !== priority) return false
    if (category !== 'all' && ticket.category !== category) return false
    if (type !== 'all' && ticket.type !== type) return false
    if (!rawSearch || rawSearch.length < 2) return true

    const searchableText = `${ticket.title} ${ticket.description} ${ticket.number} ${ticket.category} ${ticket.type || ''} ${ticket.product || ''} ${ticket.product_reference_number || ''} ${ticket.assigned_user?.full_name || ''} ${ticket.assigned_user?.email || ''}`.toLowerCase()
    return searchableText.includes(rawSearch)
  })
}

export default function TicketsPage() {
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const { setTickets, filters, setFilters } = useTicketStore()
  const [tickets, setTicketsList] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
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
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }

        const { data: userData } = await supabase.from('tbl_users').select('id, email, full_name, role').eq('id', session.user.id).single()
        const admin = userData?.role === 'admin'

        setIsAdmin(admin)
        setIsAdminLocal(admin)
        setUser({ id: session.user.id, email: session.user.email || '', full_name: userData?.full_name || '', role: userData?.role || 'user' })
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
        let fetchedTickets: Ticket[] = []

        let authHeader: string
        try {
          authHeader = await getAdminAuthHeader()
        } catch (error) {
          if (!cancelled) {
            await supabase.auth.signOut()
            router.push('/auth')
          }
          return
        }
        const response = await fetch('/api/admin/tickets', { headers: { Authorization: authHeader } })
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401 && !cancelled) {
            await supabase.auth.signOut()
            router.push('/auth')
            return
          }
          const errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
          throw new Error(errorMessage || 'Failed to fetch tickets')
        }

        fetchedTickets = (result.tickets || []) as Ticket[]

        const uniqueCategories = [...new Set(fetchedTickets.map(t => t.category).filter(Boolean))] as string[]
        const uniqueTypes = [...new Set(fetchedTickets.map(t => t.type).filter(Boolean))] as string[]
        setCategories(uniqueCategories)
        setTypes(uniqueTypes)

        const filtered = filterTickets(
          fetchedTickets,
          effectiveSearch,
          statusFilter,
          priorityFilter,
          categoryFilter,
          typeFilter,
          customStatuses
        )
        const sorted = sortTickets(filtered, sortField, sortOrder, customStatuses)

        if (cancelled) return

        setTicketsList(sorted)
        setTickets(fetchedTickets)
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
  }, [user, isAdminLocal, filters.search, searchQuery, statusFilter, priorityFilter, categoryFilter, typeFilter, sortField, sortOrder, setTickets, customStatuses])

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const { data } = await supabase.from('tbl_custom_statuses').select('*').order('name')
        if (data) setCustomStatuses(data)
      } catch { /* silent */ }
    }
    fetchStatuses()
  }, [])

  const resetFilters = () => {
    setFilters({ search: '' })
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setTypeFilter('all')
    setSearchQuery('')
  }

  const sortOptions: { label: string; field: SortField }[] = [
    { label: 'Date created', field: 'created_at' },
    { label: 'Last modified', field: 'updated_at' },
    { label: 'Priority', field: 'priority' },
    { label: 'Status', field: 'status' },
    { label: 'Ticket number', field: 'number' },
  ]

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.field === sortField)
    return option?.label || 'Date created'
  }

  const layoutOptions: { label: string; value: ViewMode; icon: any }[] = [
    { label: 'Card', value: 'card', icon: LayoutGrid },
    { label: 'Inbox', value: 'inbox', icon: Mail },
    { label: 'Table', value: 'table', icon: TableIcon },
  ]

  const getLayoutIcon = () => {
    const option = layoutOptions.find(o => o.value === viewMode)
    const Icon = option?.icon || LayoutGrid
    return <Icon size={14} />
  }

  const layoutMenuItems: MenuProps['items'] = layoutOptions.map(option => {
    const Icon = option.icon
    return {
      key: option.value,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 120 }}>
          <Space size={8}>
            <Icon size={14} />
            <span>{option.label}</span>
          </Space>
          {viewMode === option.value && <Check size={14} style={{ color: 'var(--ant-primary-color)' }} />}
        </div>
      ),
      onClick: () => setViewMode(option.value),
    }
  })

  const pageSizeOptions = [10, 25, 50, 100]
  const pageSizeMenuItems: MenuProps['items'] = pageSizeOptions.map(size => ({
    key: size.toString(),
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 100 }}>
        <span>{size} entries</span>
        {pageSize === size && <Check size={14} style={{ color: 'var(--ant-primary-color)' }} />}
      </div>
    ),
    onClick: () => {
      setPageSize(size)
      setCurrentPage(1)
    },
  }))

  const sortMenuItems: MenuProps['items'] = [
    ...sortOptions.map(option => ({
      key: option.field,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span>{option.label}</span>
          {sortField === option.field && <Check size={14} style={{ color: 'var(--ant-primary-color)' }} />}
        </div>
      ),
      onClick: () => setSortField(option.field),
    })),
    { type: 'divider' },
    {
      key: 'asc',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span>Ascending</span>
          {sortOrder === 'asc' && <Check size={14} style={{ color: 'var(--ant-primary-color)' }} />}
        </div>
      ),
      onClick: () => setSortOrder('asc'),
    },
    {
      key: 'desc',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span>Descending</span>
          {sortOrder === 'desc' && <Check size={14} style={{ color: 'var(--ant-primary-color)' }} />}
        </div>
      ),
      onClick: () => setSortOrder('desc'),
    },
  ]

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>Tickets</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
              {isAdminLocal ? 'All tickets' : 'View and manage your tickets'}
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

          <Dropdown menu={{ items: sortMenuItems }} trigger={['click']} placement="bottomLeft">
            <Button
              size="middle"
              style={{ height: 32, minWidth: 160 }}
            >
              <Space size={8}>
                <ArrowUpDown size={14} />
                <span style={{ fontSize: 13 }}>Sort by: {getSortLabel()}</span>
              </Space>
            </Button>
          </Dropdown>

          <Dropdown menu={{ items: layoutMenuItems }} trigger={['click']} placement="bottomLeft">
            <Button
              size="middle"
              style={{ height: 32, minWidth: 120 }}
            >
              <Space size={8}>
                {getLayoutIcon()}
                <span style={{ fontSize: 13 }}>Layout: {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
              </Space>
            </Button>
          </Dropdown>

          <Dropdown menu={{ items: pageSizeMenuItems }} trigger={['click']} placement="bottomLeft">
            <Button
              size="middle"
              style={{ height: 32 }}
            >
              <Space size={8}>
                <List size={14} />
                <span style={{ fontSize: 13 }}>{pageSize} entries</span>
              </Space>
            </Button>
          </Dropdown>

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
          <Button size="small" onClick={resetFilters} style={{ height: 32 }}>Reset</Button>
        </div>

        {ticketError && <Alert message="Error loading tickets" description={ticketError} type="error" style={{ margin: '16px 0', borderRadius: 6 }} showIcon closable />}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Spin size="large" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: 16, fontSize: 13 }}>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <FileText size={48} style={{ color: 'var(--border-strong)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500, margin: '0 0 8px' }}>No tickets found</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>
              {isAdminLocal ? 'No tickets have been created yet.' : 'Create your first ticket to get started.'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'card' && <TicketCardView tickets={tickets} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} customStatuses={customStatuses} />}
            {viewMode === 'inbox' && <TicketInboxView tickets={tickets} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} customStatuses={customStatuses} />}
            {viewMode === 'table' && <TicketTable tickets={tickets} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} customStatuses={customStatuses} />}
          </>
        )}

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
