'use client'

import { Ticket } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Empty, Tooltip, Pagination } from 'antd'
import { priorityDisplay } from '@/lib/design-tokens'

interface TicketCardViewProps {
  tickets: Ticket[]
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

export default function TicketCardView({ 
  tickets, 
  pageSize = 20,
  currentPage = 1,
  onPageChange
}: TicketCardViewProps) {
  const paginatedTickets = tickets.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (tickets.length === 0) {
    return <Empty description={<span style={{ color: 'var(--text-tertiary)' }}>No tickets found</span>} style={{ padding: '48px 0' }} />
  }

  return (
    <div>
      {paginatedTickets.map((ticket) => {
        const p = priorityDisplay[ticket.priority]

        return (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'background-color 100ms',
                gap: 12,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Tooltip title={`${p.label} priority`}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
              </Tooltip>

              <span style={{ color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 500, flexShrink: 0, minWidth: 40 }}>#{ticket.number}</span>

              <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ticket.title}
              </span>

              <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500, padding: '2px 8px', backgroundColor: 'var(--bg-elevated)', borderRadius: 4, flexShrink: 0 }}>
                {ticket.category}
              </span>

              <span style={{ fontSize: 11, fontWeight: 500, color: p.color, flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
                {p.label}
              </span>

              <span style={{ color: 'var(--text-tertiary)', fontSize: 11, flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false })}
              </span>
            </div>
          </Link>
        )
      })}
      {tickets.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', backgroundColor: 'var(--bg-surface)' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={tickets.length}
            onChange={onPageChange}
            size="small"
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  )
}
