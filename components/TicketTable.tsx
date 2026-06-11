'use client'

import { Ticket, Priority, Status } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { Table, Button, Tag, Modal, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'

interface TicketTableProps {
  tickets: Ticket[]
  onTicketsDeleted?: () => void
  selectedRowKeys?: string[]
  onSelectionChange?: (keys: string[]) => void
}

const categoryConfig: Record<string, string> = {
  'Bug Report': 'red', 'Technical Issue': 'purple', 'Account Inquiry': 'cyan', 'New Feature Request': 'blue', 'Other': 'default',
}

export default function TicketTable({ tickets, onTicketsDeleted, selectedRowKeys = [], onSelectionChange }: TicketTableProps) {
  const { isAdmin } = useAuthStore()

  const columns = [
    {
      title: 'ID', dataIndex: 'number', key: 'number', width: 60,
      render: (n: number, r: Ticket) => <Link href={`/tickets/${r.id}`} style={{ color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 500 }}>#{n}</Link>,
    },
    {
      title: 'Title', dataIndex: 'title', key: 'title', ellipsis: { showTitle: false },
      render: (t: string, r: Ticket) => <Link href={`/tickets/${r.id}`} style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{t}</Link>,
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 130,
      render: (c: string) => <Tag color={categoryConfig[c] || 'default'} style={{ fontSize: 11 }}>{c}</Tag>,
    },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority', width: 90,
      render: (p: Priority) => {
        const d = priorityDisplay[p]
        return <span style={{ fontSize: 11, fontWeight: 500, color: d.color }}>{d.label}</span>
      },
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s: Status) => {
        const d = statusDisplay[s]
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 500, color: d.color, backgroundColor: d.bg }}>{d.label}</span>
      },
    },
    {
      title: 'Updated', dataIndex: 'updated_at', key: 'updated_at', width: 100,
      render: (d: string) => <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{formatDistanceToNow(new Date(d), { addSuffix: false })}</span>,
    },
  ]

  return (
    <div>
      <Table
        columns={columns}
        dataSource={tickets.map((t) => ({ ...t, key: t.id }))}
        pagination={{ pageSize: 20 }}
        rowSelection={isAdmin ? { 
          selectedRowKeys, 
          onChange: (keys) => onSelectionChange?.(keys as string[]) 
        } : undefined}
        size="small"
      />
    </div>
  )
}

