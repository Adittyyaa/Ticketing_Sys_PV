'use client'

import { Ticket, Priority, Status } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Table, Tag, Avatar, Tooltip, Select, message } from 'antd'
import { useAuthStore } from '@/lib/store'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'
import { User, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

interface TicketTableProps {
  tickets: Ticket[]
  onTicketsDeleted?: () => void
  selectedRowKeys?: string[]
  onSelectionChange?: (keys: string[]) => void
}

interface UserOption {
  id: string
  email: string
  full_name?: string
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

const typeConfig: Record<string, string> = {
  'Support Request': 'blue',
  'Technical Issue': 'purple',
  'Feature Request': 'green',
  'Bug Report': 'red',
  'Account Issue': 'orange',
  'Billing Query': 'gold',
  'Integration': 'cyan',
  'Configuration': 'geekblue',
  'Documentation': 'lime',
  'Training': 'magenta',
}

export default function TicketTableEnhanced({ tickets, selectedRowKeys = [], onSelectionChange }: TicketTableProps) {
  const { isAdmin } = useAuthStore()
  const [users, setUsers] = useState<UserOption[]>([])
  const [assigningTicket, setAssigningTicket] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('tbl_users')
      .select('id, email, full_name')
      .order('email')
    
    if (data) setUsers(data)
  }

  const handleAssignTicket = async (ticketId: string, assigneeId: string | null) => {
    setAssigningTicket(ticketId)
    try {
      const { error } = await supabase
        .from('tbl_tickets')
        .update({ assigned_to: assigneeId })
        .eq('id', ticketId)

      if (error) throw error
      
      message.success(assigneeId ? 'Ticket assigned successfully' : 'Assignment removed')
      
      // Refresh the page or update local state
      window.location.reload()
    } catch (error: any) {
      message.error(`Failed to assign ticket: ${error.message}`)
    } finally {
      setAssigningTicket(null)
    }
  }

  const columns = [
    {
      title: '#', 
      dataIndex: 'number', 
      key: 'number', 
      width: 70,
      render: (n: number, r: Ticket) => (
        <Link href={`/tickets/${r.id}`} style={{ color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 600 }}>
          #{n}
        </Link>
      ),
    },
    {
      title: 'Title', 
      dataIndex: 'title', 
      key: 'title', 
      width: 250,
      ellipsis: { showTitle: false },
      render: (t: string, r: Ticket) => (
        <Tooltip title={t}>
          <Link href={`/tickets/${r.id}`} style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
            {t}
          </Link>
        </Tooltip>
      ),
    },
    {
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type', 
      width: 140,
      render: (type: string) => type ? (
        <Tag color={typeConfig[type] || 'default'} style={{ fontSize: 11, margin: 0 }}>
          {type}
        </Tag>
      ) : (
        <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>-</span>
      ),
    },
    {
      title: 'Category', 
      dataIndex: 'category', 
      key: 'category', 
      width: 130,
      render: (c: string) => (
        <Tag color={categoryConfig[c] || 'default'} style={{ fontSize: 11, margin: 0 }}>
          {c}
        </Tag>
      ),
    },
    {
      title: 'Product Ref', 
      dataIndex: 'product_reference_number', 
      key: 'product_reference_number', 
      width: 130,
      render: (ref: string) => ref ? (
        <Tooltip title={ref}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Package size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {ref.length > 12 ? `${ref.substring(0, 12)}...` : ref}
            </span>
          </div>
        </Tooltip>
      ) : (
        <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>-</span>
      ),
    },
    {
      title: 'Priority', 
      dataIndex: 'priority', 
      key: 'priority', 
      width: 90,
      sorter: (a: Ticket, b: Ticket) => {
        const order = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        return (order[a.priority] || 0) - (order[b.priority] || 0)
      },
      render: (p: Priority) => {
        const d = priorityDisplay[p]
        return (
          <Tag color={d.color} style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>
            {d.label}
          </Tag>
        )
      },
    },
    {
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (s: Status) => {
        const d = statusDisplay[s]
        return (
          <Tag bordered={false} style={{ fontSize: 11, fontWeight: 500, margin: 0 }}>
            {d.label}
          </Tag>
        )
      },
    },
    ...(isAdmin ? [{
      title: 'Assigned To', 
      dataIndex: 'assigned_to', 
      key: 'assigned_to', 
      width: 180,
      render: (assignedTo: string, record: Ticket) => (
        <Select
          style={{ width: '100%', fontSize: 11 }}
          placeholder="Unassigned"
          value={assignedTo || undefined}
          onChange={(value) => handleAssignTicket(record.id, value || null)}
          loading={assigningTicket === record.id}
          allowClear
          size="small"
        >
          {users.map(u => (
            <Select.Option key={u.id} value={u.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar size={16} icon={<User size={10} />} />
                <span>{u.full_name || u.email}</span>
              </div>
            </Select.Option>
          ))}
        </Select>
      ),
    }] : []),
    {
      title: 'Created By', 
      dataIndex: 'user_id', 
      key: 'user_id', 
      width: 100,
      render: (_: string, record: Ticket) => {
        const email = record.creator?.email || 'Unknown'
        const name = record.creator?.full_name || email.split('@')[0]
        return (
          <Tooltip title={email}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar size={20} icon={<User size={12} />} style={{ backgroundColor: '#1890ff' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {name.length > 10 ? `${name.substring(0, 10)}...` : name}
              </span>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: 'Tags', 
      dataIndex: 'tags', 
      key: 'tags', 
      width: 150,
      render: (tags: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} style={{ fontSize: 10, margin: 0, padding: '0 6px', lineHeight: '18px' }}>
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag style={{ fontSize: 10, margin: 0, padding: '0 6px', lineHeight: '18px', backgroundColor: 'var(--bg-elevated)' }}>
              +{tags.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Updated', 
      dataIndex: 'updated_at', 
      key: 'updated_at', 
      width: 100,
      sorter: (a: Ticket, b: Ticket) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      render: (d: string) => (
        <Tooltip title={new Date(d).toLocaleString()}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
            {formatDistanceToNow(new Date(d), { addSuffix: true })}
          </span>
        </Tooltip>
      ),
    },
  ]

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <Table
        columns={columns}
        dataSource={tickets.map((t) => ({ ...t, key: t.id }))}
        pagination={{ 
          pageSize: 25,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tickets`,
          pageSizeOptions: ['10', '25', '50', '100']
        }}
        rowSelection={isAdmin ? { 
          selectedRowKeys, 
          onChange: (keys) => onSelectionChange?.(keys as string[]) 
        } : undefined}
        size="middle"
        scroll={{ x: 1400 }}
        rowClassName={() => 'hover:bg-gray-50'}
      />
    </div>
  )
}
