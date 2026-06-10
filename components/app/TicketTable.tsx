'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Ticket } from '@/types/types'
import { priorityStyles, statusStyles } from '@/lib/ui'
import { format } from 'date-fns'

export function TicketTable({
  tickets,
  emptyMessage = 'No tickets found in this category.',
}: {
  tickets: Ticket[]
  emptyMessage?: string
}) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const rows = tickets.slice(start, start + pageSize)

  if (tickets.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
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
            {rows.map((t) => (
              <tr
                key={t.id}
                onClick={() => router.push(`/tickets/${t.id}`)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-muted">#{t.number}</td>
                <td className="max-w-[280px] truncate px-4 py-3.5 text-sm font-medium text-ink">
                  {t.title}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">{t.category}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityStyles[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[t.status]}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">
                  {t.created_at ? format(new Date(t.created_at), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Showing {start + 1}-{Math.min(start + pageSize, tickets.length)} of {tickets.length}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-8 rounded-md border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-brand"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-canvas disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm font-medium text-ink">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-canvas disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
