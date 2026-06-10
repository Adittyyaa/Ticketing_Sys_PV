'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app/AppShell'
import { TicketTable } from '@/components/app/TicketTable'
import { useAuthStore, useTicketStore } from '@/lib/store'
import { getAdminAuthHeader } from '@/lib/admin-api'
import { exportTicketsCsv } from '@/lib/csv'
import { statusBarColor, priorityBarColor } from '@/lib/ui'
import type { Ticket, Status, Priority } from '@/types/types'
import Link from 'next/link'
import {
  Download,
  Plus,
  Search,
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const STATUS_ORDER: Status[] = ['UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED']
const PRIORITY_ORDER: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW']

function AdminDashboard() {
  const { user } = useAuthStore()
  const { setTickets } = useTicketStore()
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [tab, setTab] = useState<'my' | 'other'>('my')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const authHeader = await getAdminAuthHeader()
        const qs = submittedSearch ? `?search=${encodeURIComponent(submittedSearch)}` : ''
        const res = await fetch(`/api/admin/tickets${qs}`, {
          headers: { Authorization: authHeader },
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to fetch tickets')
        const tickets = (result.tickets || []) as Ticket[]
        setAllTickets(tickets)
        setTickets(tickets)
      } catch (err) {
        console.error('[v0] Failed to fetch tickets:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [user, submittedSearch, setTickets])

  const myTickets = useMemo(
    () => allTickets.filter((t) => t.user_id === user?.id),
    [allTickets, user?.id]
  )
  const otherTickets = useMemo(
    () => allTickets.filter((t) => t.user_id !== user?.id),
    [allTickets, user?.id]
  )

  const metrics = useMemo(() => {
    const total = allTickets.length
    const solved = allTickets.filter((t) => t.status === 'SOLVED').length
    const uniqueUsers = new Set(allTickets.map((t) => t.user_id)).size
    const open = allTickets.filter((t) => t.status === 'OPENED' || t.status === 'PENDING').length
    return { total, solved, uniqueUsers, open }
  }, [allTickets])

  const statusBreakdown = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({
        label: s.charAt(0) + s.slice(1).toLowerCase(),
        value: allTickets.filter((t) => t.status === s).length,
        color: statusBarColor[s],
      })),
    [allTickets]
  )

  const priorityBreakdown = useMemo(
    () =>
      PRIORITY_ORDER.map((p) => ({
        label: p.charAt(0) + p.slice(1).toLowerCase(),
        value: allTickets.filter((t) => t.priority === p).length,
        color: priorityBarColor[p],
      })),
    [allTickets]
  )

  const displayed = tab === 'my' ? myTickets : otherTickets
  const total = allTickets.length || 1

  const cards = [
    { label: 'Total Tickets', value: metrics.total, icon: TicketIcon },
    { label: 'Solved Tickets', value: metrics.solved, icon: CheckCircle2 },
    { label: 'Open / Pending', value: metrics.open, icon: Clock },
    { label: 'Unique Users', value: metrics.uniqueUsers, icon: Users },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Ticket Management</h1>
          <p className="mt-1 text-sm text-muted">
            Track, prioritize and resolve customer issues across your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportTicketsCsv(displayed)}
            disabled={displayed.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link>
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Add Ticket
          </Link>
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSubmittedSearch(search.trim())
        }}
        className="mt-6 rounded-xl border border-line bg-surface p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="h-9 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:bg-surface"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted">{m.label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                {loading ? '—' : m.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Breakdowns */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard title="Status Breakdown" data={statusBreakdown} total={total} />
        <BreakdownCard title="Priority Breakdown" data={priorityBreakdown} total={total} />
      </div>

      {/* Tabs + table */}
      <div className="mt-6 rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-1 border-b border-line px-3 pt-3">
          {(
            [
              { key: 'my', label: `My Tickets (${myTickets.length})` },
              { key: 'other', label: `Other Tickets (${otherTickets.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tickets...
          </div>
        ) : (
          <TicketTable
            tickets={displayed}
            emptyMessage={
              tab === 'my'
                ? 'You have not raised any tickets yet.'
                : 'No tickets from other users.'
            }
          />
        )}
      </div>
    </div>
  )
}

function BreakdownCard({
  title,
  data,
  total,
}: {
  title: string
  data: { label: string; value: number; color: string }[]
  total: number
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-4 flex flex-col gap-4">
        {data.map((d) => (
          <div key={d.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">{d.label}</span>
              <span className="font-medium text-ink">{d.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className={`h-full rounded-full ${d.color}`}
                style={{ width: `${(d.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <AppShell requireAdmin>
      <AdminDashboard />
    </AppShell>
  )
}
