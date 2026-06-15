'use client'

import { Ticket } from '@/types/types'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { Tag, Tooltip } from 'antd'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'
import { Package, Clock } from 'lucide-react'

interface TicketCompactViewProps {
  tickets: Ticket[]
}

const categoryConfig: Record<string, string> = {
  'Bug Report': 'red',
  'Technical Issue': 'purple',
  'Account Inquiry': 'cyan',
  'Account Management': 'cyan',
  'New Feature Request': 'blue',
  'Feature Request': 'blue',
  'Billing': 'orange',
  'General Inquiry': 'default',
  'Other': 'default',
}

export default function TicketCompactView({ tickets }: TicketCompactViewProps) {
  return (
    <div style={{ 
      backgroundColor: 'var(--bg-surface)', 
      border: '1px solid var(--border-subtle)', 
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      {tickets.map((ticket, index) => {
        const priorityConfig = priorityDisplay[ticket.priority]
        const statusConfig = statusDisplay[ticket.status]
        
        return (
          <Link 
            key={ticket.id} 
            href={`/tickets/${ticket.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: index < tickets.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                borderLeft: `3px solid ${priorityConfig.color}`,
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {/* ID */}
              <div style={{ width: 60, flexShrink: 0 }}>
                <Tag color="blue" style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>
                  #{ticket.number}
                </Tag>
              </div>

              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {ticket.title}
                </div>
              </div>

              {/* Category */}
              <div style={{ width: 120, flexShrink: 0 }}>
                <Tag color={categoryConfig[ticket.category] || 'default'} style={{ fontSize: 11, margin: 0 }}>
                  {ticket.category}
                </Tag>
              </div>

              {/* Type */}
              {ticket.type && (
                <div style={{ width: 130, flexShrink: 0 }}>
                  <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                    {ticket.type}
                  </Tag>
                </div>
              )}

              {/* Product Ref */}
              {ticket.product_reference_number && (
                <Tooltip title={ticket.product_reference_number}>
                  <div style={{ width: 110, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Package size={12} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ 
                      fontSize: 11, 
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {ticket.product_reference_number}
                    </span>
                  </div>
                </Tooltip>
              )}

              {/* Priority */}
              <div style={{ width: 80, flexShrink: 0 }}>
                <Tag color={priorityConfig.color} style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>
                  {priorityConfig.label}
                </Tag>
              </div>

              {/* Status */}
              <div style={{ width: 90, flexShrink: 0 }}>
                <Tag bordered={false} style={{ fontSize: 11, fontWeight: 500, margin: 0 }}>
                  {statusConfig.label}
                </Tag>
              </div>

              {/* Updated */}
              <Tooltip title={format(new Date(ticket.updated_at), 'PPpp')}>
                <div style={{ width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </Tooltip>
            </div>
          </Link>
        )
      })}
      
      {tickets.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          No tickets found
        </div>
      )}
    </div>
  )
}
