'use client'

import { Ticket } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Empty, Checkbox, Tooltip } from 'antd'
import { useState } from 'react'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'

interface TicketCardViewProps {
  tickets: Ticket[]
  onSelectionChange?: (selectedIds: string[]) => void
  showSelection?: boolean
  selectedIds?: string[]
}

const getAvatarColor = (userId: string): string => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4', '#ec4899']
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
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

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 500, color: s.color, backgroundColor: s.bg, flexShrink: 0 }}>
                {s.label}
              </span>

              <span style={{ fontSize: 11, fontWeight: 500, color: p.color, flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
                {p.label}
              </span>

              <span style={{ color: 'var(--text-tertiary)', fontSize: 11, flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false })}
              </span>

              <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: getAvatarColor(ticket.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>{ticket.user_id.substring(0, 1).toUpperCase()}</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
