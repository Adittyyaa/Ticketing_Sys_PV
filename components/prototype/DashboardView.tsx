'use client'

import { useState } from 'react'
import {
  Download,
  Plus,
  Search,
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  tickets,
  statusStyles,
  priorityStyles,
  type TicketRow,
} from './mock-data'

const metrics = [
  { label: 'Total Tickets', value: '100', icon: TicketIcon, delta: '+12 this week' },
  { label: 'Solved Tickets', value: '64', icon: CheckCircle2, delta: '64% resolution' },
  { label: 'Avg Resolution', value: '4.2h', icon: Clock, delta: '-18% vs last mo' },
  { label: 'Unique Users', value: '38', icon: Users, delta: '+5 new users' },
]

const statusBreakdown = [
  { label: 'Untouched', value: 14, color: 'bg-slate-400' },
  { label: 'Pending', value: 22, color: 'bg-amber-500' },
  { label: 'Opened', value: 28, color: 'bg-blue-500' },
  { label: 'Solved', value: 36, color: 'bg-emerald-500' },
]

const priorityBreakdown = [
  { label: 'Critical', value: 9, color: 'bg-red-500' },
  { label: 'High', value: 21, color: 'bg-orange-500' },
  { label: 'Medium', value: 38, color: 'bg-sky-500' },
  { label: 'Low', value: 32, color: 'bg-slate-400' },
]

const PAGE_SIZE = 10

export function DashboardView({ onOpenTicket }: { onOpenTicket: (id: number) => void }) {
  const [tab, setTab] = useState<'my' | 'other'>('my')
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(tickets.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const rows = tickets.slice(start, start + PAGE_SIZE)

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Ticket Management</h1>
          <p className="mt-1 text-sm text-muted">
            Track, prioritize and resolve customer issues across your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas">
            <Plus className="h-4 w-4" />
            Add User
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" />
            Add Ticket
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="mt-6 rounded-xl border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              placeholder="Search by title or ID..."
              className="h-9 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-faint outline-none focus:border-brand focus:bg-surface"
            />
          </div>
          <select className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand">
            <option>All Categories</option>
            <option>Bug Report</option>
            <option>Feature Request</option>
            <option>Billing</option>
          </select>
          <select className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand">
            <option>All Statuses</option>
            <option>Untouched</option>
            <option>Pending</option>
            <option>Opened</option>
            <option>Solved</option>
          </select>
          <input
            type="date"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-muted outline-none focus:border-brand"
          />
          <span className="text-sm text-faint">to</span>
          <input
            type="date"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-muted outline-none focus:border-brand"
          />
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90">
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted">{m.label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{m.value}</p>
              <p className="mt-1 text-xs text-muted">{m.delta}</p>
            </div>
          )
        })}
      </div>

      {/* Breakdown widgets */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard title="Status Breakdown" data={statusBreakdown} total={100} />
        <BreakdownCard title="Priority Breakdown" data={priorityBreakdown} total={100} />
      </div>

      {/* Tabs + table */}
      <div className="mt-6 rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-1 border-b border-line px-3 pt-3">
          {(
            [
              { key: 'my', label: 'My Tickets' },
              { key: 'other', label: 'Other Tickets' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-brand text-brand'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <TicketTable rows={rows} onOpenTicket={onOpenTicket} />

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Showing {start + 1}-{Math.min(start + PAGE_SIZE, tickets.length)} of {tickets.length}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Rows per page</span>
              <select className="h-8 rounded-md border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-brand">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-canvas disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`gap-${i}`} className="px-1 text-sm text-faint">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium ${
                      page === p
                        ? 'bg-brand text-white'
                        : 'border border-line text-muted hover:bg-canvas'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-canvas disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
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

function TicketTable({
  rows,
  onOpenTicket,
}: {
  rows: TicketRow[]
  onOpenTicket: (id: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-line">
            {['ID', 'Title', 'Category', 'Priority', 'Status', 'Created'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onOpenTicket(row.id)}
              className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas"
            >
              <td className="px-4 py-3.5 text-sm font-medium text-muted">#{row.id}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-ink">{row.title}</td>
              <td className="px-4 py-3.5 text-sm text-muted">{row.category}</td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityStyles[row.priority]}`}
                >
                  {row.priority}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[row.status]}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3.5 text-sm text-muted">{row.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function pageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
  return [1, '...', current, '...', total]
}
