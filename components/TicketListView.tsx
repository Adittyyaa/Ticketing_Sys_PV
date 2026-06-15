'use client'

import { Ticket, Priority, Status } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Tag, Avatar, Card, Space, Row, Col } from 'antd'
import { useAuthStore } from '@/lib/store'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'
import { User, Package, Calendar, Clock, MessageSquare } from 'lucide-react'

interface TicketListViewProps {
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

export default function TicketListView({ tickets }: TicketListViewProps) {
  const { isAdmin } = useAuthStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tickets.map((ticket) => {
        const priorityConfig = priorityDisplay[ticket.priority]
        const statusConfig = statusDisplay[ticket.status]
        
        return (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
            <Card
              hoverable
              style={{
                borderLeft: `4px solid ${priorityConfig.color}`,
                backgroundColor: 'var(--bg-surface)',
                transition: 'all 0.2s',
              }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Row gutter={[16, 12]}>
                {/* Main Content */}
                <Col xs={24} md={16}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 8 }}>
                    <Tag color="blue" style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>
                      #{ticket.number}
                    </Tag>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: 15, 
                        fontWeight: 600, 
                        color: 'var(--text-primary)', 
                        margin: '0 0 8px 0',
                        lineHeight: 1.4
                      }}>
                        {ticket.title}
                      </h3>
                      <p style={{ 
                        fontSize: 13, 
                        color: 'var(--text-secondary)', 
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {ticket.description}
                      </p>
                    </div>
                  </div>

                  {/* Tags and Metadata */}
                  <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
                    <Tag color={categoryConfig[ticket.category] || 'default'} style={{ fontSize: 11, margin: 0 }}>
                      {ticket.category}
                    </Tag>
                    {ticket.type && (
                      <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                        {ticket.type}
                      </Tag>
                    )}
                    {ticket.tags?.slice(0, 3).map(tag => (
                      <Tag key={tag} style={{ fontSize: 10, margin: 0 }}>
                        {tag}
                      </Tag>
                    ))}
                    {ticket.tags?.length > 3 && (
                      <Tag style={{ fontSize: 10, margin: 0 }}>
                        +{ticket.tags.length - 3}
                      </Tag>
                    )}
                  </Space>
                </Col>

                {/* Sidebar Info */}
                <Col xs={24} md={8}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Priority & Status */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tag 
                        color={priorityConfig.color} 
                        style={{ fontSize: 11, fontWeight: 600, margin: 0, flex: 1, textAlign: 'center' }}
                      >
                        {priorityConfig.label}
                      </Tag>
                      <Tag 
                        bordered={false}
                        style={{ fontSize: 11, fontWeight: 500, margin: 0, flex: 1, textAlign: 'center' }}
                      >
                        {statusConfig.label}
                      </Tag>
                    </div>

                    {/* Product Reference */}
                    {ticket.product_reference_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <Package size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {ticket.product_reference_number}
                        </span>
                      </div>
                    )}

                    {/* Assigned To */}
                    {isAdmin && ticket.assigned_to && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <User size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {ticket.assigned_user?.full_name || ticket.assigned_user?.email || 'Assigned'}
                        </span>
                      </div>
                    )}

                    {/* Created By */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <Avatar size={16} icon={<User size={10} />} />
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {ticket.creator?.full_name || ticket.creator?.email?.split('@')[0] || 'User'}
                      </span>
                    </div>

                    {/* Timestamps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} />
                        <span>Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
