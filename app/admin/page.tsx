'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Spin, Select, Input, Space, Tooltip } from 'antd'
import { Plus, Search, Filter, Download, List, LayoutGrid, ArrowUpDown, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketCardView from '@/components/TicketCardView'
import TicketTable from '@/components/TicketTable'
import { Ticket } from '@/types/types'
import { getAdminAuthHeader } from '@/lib/admin-api'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const { setTickets } = useTicketStore()
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [sortBy, setSortBy] = useState<'last_modified' | 'created' | 'priority'>('last_modified')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedTicketIds([])
  }, [viewMode])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return
    const { Modal, message } = await import('antd')
    Modal.confirm({
      title: 'Delete Tickets',
      content: `Are you sure you want to delete ${selectedTicketIds.length} ticket(s)? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsDeleting(true)
        try {
          const authHeader = await getAdminAuthHeader()
          const response = await fetch('/api/admin/bulk-delete-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
            body: JSON.stringify({ ticketIds: selectedTicketIds })
          })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed to delete tickets')
          message.success(`Successfully deleted ${selectedTicketIds.length} ticket(s)`)
          setSelectedTicketIds([])
          fetchAllTickets()
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Failed to delete tickets')
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  const createUserProfile = async (session: any) => {
    const { data: newUser, error } = await supabase.from('tbl_users').insert([{ id: session.user.id, email: session.user.email || '', full_name: session.user.user_metadata?.full_name || '', role: 'user', created_at: new Date().toISOString() }]).select().single()
    if (error) return null
    return newUser
  }

  const verifyAdminRole = async (userId: string) => {
    let { data: userData, error } = await supabase.from('tbl_users').select('id, email, full_name, role').eq('id', userId).single()
    if (error?.code === 'PGRST116') {
      const session = await supabase.auth.getSession()
      userData = await createUserProfile(session.data.session)
      if (!userData) return false
    } else if (error) return false
    return userData?.role === 'admin'
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }
        const isUserAdmin = await verifyAdminRole(session.user.id)
        if (!isUserAdmin) { router.push('/tickets'); return }
        setUser({ id: session.user.id, email: session.user.email || '', role: 'admin' })
        setIsAdmin(true)
        setLoading(false)
      } catch {
        router.push('/auth')
      }
    }
    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  useEffect(() => { fetchAllTickets() }, [user, isAdmin, setTickets])

  useEffect(() => {
    let filtered = [...allTickets]
    if (searchQuery) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.number.toString().includes(searchQuery))
    }
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter)
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter)
    filtered.sort((a, b) => {
      if (sortBy === 'last_modified') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      const po = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return po[a.priority] - po[b.priority]
    })
    setFilteredTickets(filtered)
  }, [allTickets, searchQuery, statusFilter, priorityFilter, sortBy])

  const fetchAllTickets = async () => {
    if (!user || !isAdmin) return
    setIsLoadingTickets(true)
    setTicketError(null)
    try {
      const authHeader = await getAdminAuthHeader()
      const response = await fetch(`/api/admin/tickets`, { headers: { Authorization: authHeader } })
      const result = await response.json()
      if (!response.ok) { setTicketError(result.error || 'Failed to fetch tickets'); throw new Error(result.error) }
      const tickets = (result.tickets || []) as Ticket[]
      setAllTickets(tickets)
      setFilteredTickets(tickets)
      setTickets(tickets)
    } catch (error) {
      setTicketError(error instanceof Error ? error.message : 'Failed to fetch tickets')
    } finally {
      setIsLoadingTickets(false)
    }
  }

  if (!user || !isAdmin) return null

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>Tickets</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          <Space size={8}>
            <Link href="/tickets/new">
              <Button type="primary" icon={<Plus size={14} />} style={{ height: 32, fontSize: 13, fontWeight: 500, borderRadius: 6 }}>
                New Ticket
              </Button>
            </Link>
          </Space>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          {/* Search */}
          <Input
            placeholder="Search tickets..."
            prefix={<Search size={14} style={{ color: 'var(--text-placeholder)' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 260, height: 32 }}
          />

          {/* Filter Toggle */}
          <Tooltip title="Filters">
            <Button
              type={showFilters ? 'primary' : 'default'}
              icon={<Filter size={14} />}
              onClick={() => setShowFilters(!showFilters)}
              style={{ height: 32 }}
            >
              Filter
            </Button>
          </Tooltip>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-tertiary)' }} />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 140, height: 32 }}
              size="small"
              options={[
                { label: 'Last modified', value: 'last_modified' },
                { label: 'Created date', value: 'created' },
                { label: 'Priority', value: 'priority' },
              ]}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Bulk Actions */}
          {selectedTicketIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, paddingRight: 12, borderRight: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{selectedTicketIds.length} selected</span>
              <Button 
                danger 
                type="primary" 
                size="small" 
                icon={<Trash2 size={14} />} 
                onClick={handleBulkDelete}
                loading={isDeleting}
                style={{ borderRadius: 4 }}
              >
                Delete
              </Button>
            </div>
          )}

          {/* View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'var(--bg-elevated)', borderRadius: 6, padding: 2 }}>
            <button
              onClick={() => setViewMode('card')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 4, border: 'none',
                backgroundColor: viewMode === 'card' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'card' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 4, border: 'none',
                backgroundColor: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* Export */}
          <Tooltip title="Export">
            <Button icon={<Download size={14} />} style={{ height: 32 }} />
          </Tooltip>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 12, padding: '12px 0', marginBottom: 8, borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140, height: 32 }}
              placeholder="Status"
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Untouched', value: 'UNTOUCHED' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Opened', value: 'OPENED' },
                { label: 'Solved', value: 'SOLVED' },
              ]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 140, height: 32 }}
              placeholder="Priority"
              options={[
                { label: 'All Priority', value: 'all' },
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Urgent', value: 'URGENT' },
              ]}
            />
            <Button size="small" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery('') }} style={{ height: 32 }}>
              Reset
            </Button>
          </div>
        )}

        {/* Error */}
        {ticketError && <Alert message="Error loading tickets" description={ticketError} type="error" style={{ margin: '16px 0', borderRadius: 6 }} showIcon closable />}

        {/* Content */}
        {isLoadingTickets ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Spin size="large" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: 16, fontSize: 13 }}>Loading tickets...</p>
          </div>
        ) : viewMode === 'card' ? (
          <TicketCardView 
            tickets={filteredTickets} 
            selectedIds={selectedTicketIds}
            onSelectionChange={setSelectedTicketIds} 
            showSelection={true} 
          />
        ) : (
          <TicketTable 
            tickets={filteredTickets} 
            selectedRowKeys={selectedTicketIds}
            onSelectionChange={setSelectedTicketIds}
            onTicketsDeleted={fetchAllTickets}
          />
        )}
      </div>
    </AppShell>
  )
}
