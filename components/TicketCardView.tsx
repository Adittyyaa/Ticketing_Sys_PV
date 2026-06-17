'use client'

import { Ticket } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Empty, Pagination, Tag } from 'antd'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'

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
    <div style={{ 
      backgroundColor: 'var(--bg-surface)', 
      border: '1px solid var(--border-subtle)', 
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 16, 
        padding: 16 
      }}>
        {paginatedTickets.map((ticket) => {
          const p = priorityDisplay[ticket.priority]
          const s = statusDisplay[ticket.status]

          return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 500 }}>#{ticket.number}</span>
                  <Tag color={p.color} style={{ fontSize: 11, fontWeight: 500, margin: 0 }}>
                    {p.label}
                  </Tag>
                </div>

                <h3 style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {ticket.title}
                </h3>

                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: 12, 
                  margin: 0,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 36,
                }}>
                  {ticket.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <Tag color={s.color === 'var(--accent-success)' ? 'green' : s.color === 'var(--accent-warning)' ? 'orange' : s.color === 'var(--accent-primary)' ? 'blue' : 'default'} style={{ fontSize: 11, margin: 0 }}>
                    {s.label}
                  </Tag>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      {tickets.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
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