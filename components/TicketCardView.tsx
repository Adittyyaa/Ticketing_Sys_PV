'use client'

import { Ticket } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Empty, Checkbox, Tooltip } from 'antd'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'

interface TicketCardViewProps {
  tickets: Ticket[]
  onSelectionChange?: (selectedIds: string[]) => void
  showSelection?: boolean
  selectedIds?: string[]
}

export default function TicketCardView({ 
  tickets, 
  onSelectionChange, 
  showSelection = false,
  selectedIds = [] 
}: TicketCardViewProps) {

  const handleSelect = (ticketId: string, checked: boolean) => {
    const newSelection = checked ? [...selectedIds, ticketId] : selectedIds.filter(id => id !== ticketId)
    onSelectionChange?.(newSelection)
  }

  if (tickets.length === 0) {
    return <Empty description={<span style={{ color: 'var(--text-tertiary)' }}>No tickets found</span>} style={{ padding: '48px 0' }} />
  }

  return (
    <div>
      {tickets.map((ticket) => {
        const p = priorityDisplay[ticket.priority]
        const s = statusDisplay[ticket.status]
        const isSelected = selectedIds.includes(ticket.id)

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
                backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'background-color 100ms',
                gap: 12,
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
              onClick={(e) => {
                if (showSelection && (e.target as HTMLElement).closest('.ticket-checkbox')) {
                  e.preventDefault()
                }
              }}
            >
              {showSelection && (
                <div className="ticket-checkbox" style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onChange={(e) => handleSelect(ticket.id, e.target.checked)} />
                </div>
              )}

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
    </div>
  )
}
