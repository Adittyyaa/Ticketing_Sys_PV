'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Spin, Tag, Space, Card, Row, Col, Segmented, Dropdown, MenuProps, Badge } from 'antd'
import { FileText, Plus,  Filter, User, Clock, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Grid, Table as TableIcon, Mail, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketTable from '@/components/TicketTable'
import TicketCardView from '@/components/TicketCardView'
import TicketInboxView from '@/components/TicketInboxView'
import TicketFilterDrawer from '@/components/TicketFilterDrawer'
import { Ticket } from '@/types/types'
import { getAdminAuthHeader } from '@/lib/admin-api'
import Link from 'next/link'

type ViewMode = 'card' | 'inbox' | 'table'
type PredefindFilter = 'all' | 'my_open' | 'assigned_to_me' | 'unassigned' | 'high_priority' | 'urgent'
type SortField = 'created_at' | 'updated_at' | 'priority' | 'status' | 'title' | 'number'
type SortOrder = 'asc' | 'desc'



const predefinedFilters: { label: string; value: PredefindFilter; icon: any; description: string }[] = [
  { label: 'All Tickets', value: 'all', icon: FileText, description: 'View all tickets' },
  { label: 'My Open Tickets', value: 'my_open', icon: User, description: 'Tickets I created that are not solved' },
  { label: 'Assigned to Me', value: 'assigned_to_me', icon: User, description: 'Tickets assigned to me' },
  { label: 'Unassigned', value: 'unassigned', icon: AlertCircle, description: 'Tickets without an assignee' },
  { label: 'High Priority', value: 'high_priority', icon: Clock, description: 'High and urgent tickets' },
  { label: 'Urgent Only', value: 'urgent', icon: AlertCircle, description: 'Only urgent tickets' },
]

function applyPredefinedFilter(tickets: Ticket[], filter: PredefindFilter, userId: string): Ticket[] {
  switch (filter) {
    case 'my_open':
      return tickets.filter(t => t.user_id === userId && t.status !== 'SOLVED')
    case 'assigned_to_me':
      return tickets.filter(t => t.assigned_to === userId)
    case 'unassigned':
      return tickets.filter(t => !t.assigned_to)
    case 'high_priority':
      return tickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT')
    case 'urgent':
      return tickets.filter(t => t.priority === 'URGENT')
    default:
      return tickets
  }
}

function sortTickets(tickets: Ticket[], field: SortField, order: SortOrder): Ticket[] {
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
      case 'status':
        const statusOrder = { UNTOUCHED: 1, PENDING: 2, OPENED: 3, SOLVED: 4 }
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
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
  type: string
) {
  const rawSearch = search.trim().replace(/[%;]/g, '').substring(0, 100).toLowerCase()

  return tickets.filter((ticket) => {
    if (status !== 'all' && ticket.status !== status) return false
    if (priority !== 'all' && ticket.priority !== priority) return false
    if (category !== 'all' && ticket.category !== category) return false
    if (type !== 'all' && ticket.type !== type) return false
    if (!rawSearch || rawSearch.length < 2) return true

    const searchableText = `${ticket.title} ${ticket.description} ${ticket.number} ${ticket.product_reference_number || ''}`.toLowerCase()
    return searchableText.includes(rawSearch)
  })
}

export default function TicketsPage() {
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const { setTickets } = useTicketStore()
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('inbox')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [predefinedFilter, setPredefinedFilter] = useState<PredefindFilter>('all')
  const [isAdminLocal, setIsAdminLocal] = useState(isAdmin)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ticketsPerPage = 50

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
    const fetchCategories = async () => {
      const { data } = await supabase.from('tbl_categories').select('name').order('name')
      if (data) setCategories(data.map(c => c.name))
    }
    
    const fetchTypes = async () => {
      const { data } = await supabase.from('tbl_ticket_types').select('name').order('name')
      if (data) setTypes(data.map(t => t.name))
    }

    fetchCategories()
    fetchTypes()
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchTickets = async () => {
      setIsLoading(true)
      setTicketError(null)

      try {
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
          const { data, error } = await supabase
            .from('tbl_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error
          tickets = (data || []) as Ticket[]
        }

        if (cancelled) return

        setAllTickets(tickets)
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
  }, [user, isAdminLocal, setTickets])

  useEffect(() => {
    if (!user) return
    
    let filtered = applyPredefinedFilter(allTickets, predefinedFilter, user.id)
    filtered = filterTickets(filtered, searchQuery, statusFilter, priorityFilter, categoryFilter, typeFilter)
    filtered = sortTickets(filtered, sortField, sortOrder)
    setFilteredTickets(filtered)
  }, [allTickets, predefinedFilter, searchQuery, statusFilter, priorityFilter, categoryFilter, typeFilter, sortField, sortOrder, user])

  const resetFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setTypeFilter('all')
    setSearchQuery('')
    setPredefinedFilter('all')
    setSortField('updated_at')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const getAppliedFiltersCount = () => {
    let count = 0
    if (searchQuery) count++
    if (statusFilter !== 'all') count++
    if (priorityFilter !== 'all') count++
    if (categoryFilter !== 'all') count++
    if (typeFilter !== 'all') count++
    return count
  }

  const appliedFiltersCount = getAppliedFiltersCount()

  const sortMenuItems: MenuProps['items'] = [
    {
      key: 'updated_at',
      label: 'Last Modified',
      icon: sortField === 'updated_at' ? <Clock size={14} /> : null,
    },
    {
      key: 'created_at',
      label: 'Date Created',
      icon: sortField === 'created_at' ? <Clock size={14} /> : null,
    },
    {
      key: 'priority',
      label: 'Priority',
      icon: sortField === 'priority' ? <AlertCircle size={14} /> : null,
    },
    {
      key: 'status',
      label: 'Status',
      icon: sortField === 'status' ? <FileText size={14} /> : null,
    },
    {
      key: 'title',
      label: 'Title (A-Z)',
      icon: sortField === 'title' ? <FileText size={14} /> : null,
    },
    {
      key: 'number',
      label: 'Ticket Number',
      icon: sortField === 'number' ? <FileText size={14} /> : null,
    },
  ]

  const handleSortChange = (key: string) => {
    const newField = key as SortField
    if (sortField === newField) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default desc order
      setSortField(newField)
      setSortOrder('desc')
    }
  }

  const getSortLabel = () => {
    const labels = {
      updated_at: 'Last Modified',
      created_at: 'Date Created',
      priority: 'Priority',
      status: 'Status',
      title: 'Title',
      number: 'Number',
    }
    return labels[sortField]
  }

  const getFilterStats = () => {
    if (!user) return {}
    return {
      all: allTickets.length,
      my_open: allTickets.filter(t => t.user_id === user.id && t.status !== 'SOLVED').length,
      assigned_to_me: allTickets.filter(t => t.assigned_to === user.id).length,
      unassigned: allTickets.filter(t => !t.assigned_to).length,
      high_priority: allTickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length,
      urgent: allTickets.filter(t => t.priority === 'URGENT').length,
    }
  }

  const stats = getFilterStats()

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage)
  const startIndex = (currentPage - 1) * ticketsPerPage
  const endIndex = startIndex + ticketsPerPage
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '32px 48px', maxWidth: 1600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 600, margin: '0 0 8px 0' }}>Tickets</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>
              {isAdminLocal ? 'Manage all tickets and assignments' : 'View and manage your support tickets'}
            </p>
          </div>
          <Link href="/tickets/new">
            <Button type="primary" icon={<Plus size={16} />} size="large" style={{ fontWeight: 600 }}>
              Create New Ticket
            </Button>
          </Link>
        </div>

        {/* Predefined Filters */}
        <Card style={{ marginBottom: 24, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} /> QUICK FILTERS
            </h3>
          </div>
          <Row gutter={[12, 12]}>
            {predefinedFilters.map((filter) => {
              const Icon = filter.icon
              const count = stats[filter.value] || 0
              const isActive = predefinedFilter === filter.value
              return (
                <Col xs={12} sm={8} md={6} lg={4} key={filter.value}>
                  <Card
                    hoverable
                    onClick={() => setPredefinedFilter(filter.value)}
                    style={{
                      backgroundColor: isActive ? 'var(--ant-primary-color-deprecated-bg)' : 'var(--bg-elevated)',
                      border: isActive ? '2px solid var(--ant-primary-color)' : '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                      <Icon size={20} style={{ color: isActive ? 'var(--ant-primary-color)' : 'var(--text-tertiary)', marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--ant-primary-color)' : 'var(--text-primary)', marginBottom: 4 }}>
                          {filter.label}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: isActive ? 'var(--ant-primary-color)' : 'var(--text-secondary)' }}>
                          {count}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </Card>

        {/* Filter Bar */}
        <Card style={{ marginBottom: 24, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            {/* Left Side - Pagination & Results */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  icon={<ChevronLeft size={16} />}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  size="large"
                />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', minWidth: 100, textAlign: 'center' }}>
                  {startIndex + 1} - {Math.min(endIndex, filteredTickets.length)} of {filteredTickets.length}
                </span>
                <Button
                  icon={<ChevronRight size={16} />}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  size="large"
                />
              </div>
            </div>

            {/* Right Side - View, Sort, Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* View Mode Toggle */}
              <Segmented 
                value={viewMode} 
                onChange={(value) => setViewMode(value as ViewMode)}
                size="large"
                options={[
                  { 
                    label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Grid size={14} /> Card</span>, 
                    value: 'card'
                  },
                  { 
                    label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> Inbox</span>, 
                    value: 'inbox'
                  },
                  { 
                    label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TableIcon size={14} /> Table</span>, 
                    value: 'table'
                  }
                ]} 
              />

              {/* Sort Dropdown */}
              <Dropdown
                menu={{
                  items: sortMenuItems,
                  onClick: ({ key }) => handleSortChange(key),
                  selectable: true,
                  selectedKeys: [sortField],
                }}
                trigger={['click']}
              >
                <Button icon={<ArrowUpDown size={14} />} size="large">
                  Sort: {getSortLabel()} {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                </Button>
              </Dropdown>

              {/* Filter Button with Badge */}
              <Badge count={appliedFiltersCount} offset={[-5, 5]}>
                <Button 
                  icon={<SlidersHorizontal size={14} />} 
                  size="large"
                  onClick={() => setFilterDrawerOpen(true)}
                  type={appliedFiltersCount > 0 ? 'primary' : 'default'}
                >
                  Filters {appliedFiltersCount > 0 && `(${appliedFiltersCount})`}
                </Button>
              </Badge>
            </div>
          </div>

          {/* Applied Filters Tags */}
          {appliedFiltersCount > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <Space wrap size={[8, 8]}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>Active filters:</span>
                {searchQuery && (
                  <Tag closable onClose={() => { setSearchQuery(''); setCurrentPage(1); }} color="blue">
                    Search: "{searchQuery.substring(0, 30)}{searchQuery.length > 30 ? '...' : ''}"
                  </Tag>
                )}
                {statusFilter !== 'all' && (
                  <Tag closable onClose={() => { setStatusFilter('all'); setCurrentPage(1); }} color="blue">
                    Status: {statusFilter}
                  </Tag>
                )}
                {priorityFilter !== 'all' && (
                  <Tag closable onClose={() => { setPriorityFilter('all'); setCurrentPage(1); }} color="blue">
                    Priority: {priorityFilter}
                  </Tag>
                )}
                {categoryFilter !== 'all' && (
                  <Tag closable onClose={() => { setCategoryFilter('all'); setCurrentPage(1); }} color="blue">
                    Category: {categoryFilter}
                  </Tag>
                )}
                {typeFilter !== 'all' && (
                  <Tag closable onClose={() => { setTypeFilter('all'); setCurrentPage(1); }} color="blue">
                    Type: {typeFilter}
                  </Tag>
                )}
                <Button type="link" size="small" onClick={resetFilters} style={{ fontSize: 12, padding: 0 }}>
                  Clear all
                </Button>
              </Space>
            </div>
          )}
        </Card>

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
          onApply={() => setCurrentPage(1)}
          onReset={resetFilters}
        />

        {/* Error Alert */}
        {ticketError && (
          <Alert 
            message="Error loading tickets" 
            description={ticketError} 
            type="error" 
            style={{ marginBottom: 24, borderRadius: 8 }} 
            showIcon 
            closable 
          />
        )}

        {/* Tickets Display */}
        {isLoading ? (
          <Card style={{ textAlign: 'center', padding: '64px 0' }}>
            <Spin size="large" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: 16, fontSize: 14 }}>Loading tickets...</p>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '64px 0', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <FileText size={64} style={{ color: 'var(--border-strong)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>No tickets found</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '0 0 24px' }}>
              Try adjusting your filters or create a new ticket
            </p>
            <Link href="/tickets/new">
              <Button type="primary" icon={<Plus size={16} />} size="large">
                Create Your First Ticket
              </Button>
            </Link>
          </Card>
        ) : viewMode === 'card' ? (
          <TicketCardView tickets={paginatedTickets} />
        ) : viewMode === 'inbox' ? (
          <TicketInboxView tickets={paginatedTickets} />
        ) : (
          <TicketTable tickets={paginatedTickets} />
        )}
      </div>
    </AppShell>
  )
}
