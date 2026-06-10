'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app/AppShell'
import { TicketTable } from '@/components/app/TicketTable'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { exportTicketsCsv } from '@/lib/csv'
import type { Ticket } from '@/types/types'
import { Download, Plus, Search, Loader2, AlertCircle } from 'lucide-react'

function MyTickets() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchTickets = async () => {
      setLoading(true)
      setError(null)
      try {
        const sanitized = submitted.trim().replace(/[%;]/g, '').substring(0, 100)
        let query = supabase
          .from('tbl_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (sanitized.length >= 2) {
          query = query.ilike('title', `%${sanitized}%`)
        }

        const { data, error: qErr } = await query
        if (qErr) throw qErr
        setTickets((data || []) as Ticket[])
      } catch (err) {
        console.error('[v0] Failed to fetch tickets:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [user, submitted])

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'OPENED' || t.status === 'PENDING').length
    const solved = tickets.filter((t) => t.status === 'SOLVED').length
    return { total: tickets.length, open, solved }
  }, [tickets])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">My Tickets</h1>
          <p className="mt-1 text-sm text-muted">
            View and manage all your support tickets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportTicketsCsv(tickets)}
            disabled={tickets.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Mini stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Open', value: counts.open },
          { label: 'Solved', value: counts.solved },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-medium text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(search.trim())
        }}
        className="mt-4 rounded-xl border border-line bg-surface p-3"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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

      <div className="mt-4 rounded-xl border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tickets...
          </div>
        ) : (
          <TicketTable
            tickets={tickets}
            emptyMessage="No tickets found. Create your first ticket to get started."
          />
        )}
      </div>
    </div>
  )
}

export default function TicketsPage() {
  return (
    <AppShell>
      <MyTickets />
    </AppShell>
  )
}
