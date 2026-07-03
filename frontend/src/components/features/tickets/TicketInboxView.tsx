'use client'

import { Ticket } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Tag, Avatar, Badge, Pagination } from 'antd'
import { priorityDisplay, getStatusDisplay } from '@/lib/design-tokens'
import { User, MessageSquare, Paperclip, Calendar } from 'lucide-react'
import { CustomStatus } from '@/types/types'

interface TicketInboxViewProps {
  tickets: Ticket[]
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  customStatuses?: CustomStatus[]
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

export default function TicketInboxView({
  tickets,
  pageSize = 20,
  currentPage = 1,
  onPageChange,
  customStatuses = [],
}: TicketInboxViewProps) {
  const paginatedTickets = tickets.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      {paginatedTickets.map((ticket, index) => {
        const priorityConfig = priorityDisplay[ticket.priority]
        const statusConfig = getStatusDisplay(ticket.status, customStatuses)
        const isUnread = ticket.status === 'UNTOUCHED'
        
        return (
          <Link 
            key={ticket.id} 
            href={`/tickets/${ticket.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: index < paginatedTickets.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                borderLeft: `4px solid ${priorityConfig.color}`,
                backgroundColor: isUnread ? 'var(--bg-elevated)' : 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'start',
                gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isUnread ? 'var(--bg-elevated)' : 'transparent'
              }}
            >
              {/* Checkbox/Avatar */}
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                <Avatar 
                  size={40} 
                  icon={<User size={20} />} 
                  style={{ 
                    backgroundColor: priorityConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                >
                  {ticket.number}
                </Avatar>
              </div>

              {/* Main Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ 
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    fontFamily: 'monospace'
                  }}>
                    #{ticket.number}
                  </span>
                  <Tag color={categoryConfig[ticket.category_name || (ticket as any).category || 'Other'] || 'default'} style={{ fontSize: 10, margin: 0 }}>
                    {ticket.category_name || (ticket as any).category || 'Other'}
                  </Tag>
                  {ticket.type && (
                    <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                      {ticket.type}
                    </Tag>
                  )}
                  <Tag 
                    color={priorityConfig.color} 
                    style={{ fontSize: 10, fontWeight: 600, margin: 0 }}
                  >
                    {priorityConfig.label}
                  </Tag>
                </div>

                {/* Title */}
                <div style={{ 
                  fontSize: 15, 
                  fontWeight: isUnread ? 600 : 500,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {isUnread && (
                    <Badge status="processing" />
                  )}
                  {ticket.title}
                </div>

                {/* Description Preview */}
                <p style={{ 
                  fontSize: 13, 
                  color: 'var(--text-secondary)', 
                  margin: '0 0 8px 0',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {ticket.description}
                </p>

                {/* Meta Info */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} />
                    <span>{ticket.creator?.full_name || ticket.creator?.email?.split('@')[0] || 'Unknown'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                  </div>

                  {ticket.comment_count && ticket.comment_count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageSquare size={12} />
                      <span>{ticket.comment_count}</span>
                    </div>
                  )}

                  {ticket.tags && ticket.tags.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Paperclip size={12} />
                      <span>{ticket.tags.length} tags</span>
                    </div>
                  )}

{ticket.product_reference_number && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace' }}>
                       <span>Ref: {ticket.product_reference_number}</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                <Tag 
                  bordered={false}
                  style={{ 
                    fontSize: 11, 
                    fontWeight: 500, 
                    margin: 0,
                    padding: '4px 12px'
                  }}
                >
                  {statusConfig.label}
                </Tag>
              </div>
            </div>
          </Link>
        )
      })}
      
      {tickets.length === 0 && (
        <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No tickets found</p>
        </div>
      )}
      
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
