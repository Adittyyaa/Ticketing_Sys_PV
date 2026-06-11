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
}

const categoryConfig: Record<string, string> = {
  'Bug Report': 'red', 'Technical Issue': 'purple', 'Account Inquiry': 'cyan', 'New Feature Request': 'blue', 'Other': 'default',
}

export default function TicketTable({ tickets, onTicketsDeleted }: TicketTableProps) {
  const { isAdmin } = useAuthStore()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return
    Modal.confirm({
      title: 'Delete Tickets',
      content: `Delete ${selectedRowKeys.length} ticket(s)? This cannot be undone.`,
      okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
      onOk: async () => {
        setIsDeleting(true)
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No active session')
          const response = await fetch('/api/admin/bulk-delete-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ ticketIds: selectedRowKeys })
          })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed to delete')
          message.success(`Deleted ${selectedRowKeys.length} ticket(s)`)
          setSelectedRowKeys([])
          if (onTicketsDeleted) onTicketsDeleted()
        } catch (error) { message.error(error instanceof Error ? error.message : 'Failed to delete') }
        finally { setIsDeleting(false) }
      }
    })
  }

  const columns = [
    {
      title: 'ID', dataIndex: 'number', key: 'number', width: 60,
      render: (n: number, r: Ticket) => <Link href={`/tickets/${r.id}`} style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>#{n}</Link>,
    },
    {
      title: 'Title', dataIndex: 'title', key: 'title', ellipsis: { showTitle: false },
      render: (t: string, r: Ticket) => <Link href={`/tickets/${r.id}`} style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 500 }}>{t}</Link>,
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
      render: (d: string) => <span style={{ color: '#64748b', fontSize: 11 }}>{formatDistanceToNow(new Date(d), { addSuffix: false })}</span>,
    },
  ]

  return (
    <div>
      {isAdmin && selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 8, padding: '8px 12px', backgroundColor: '#1a2236', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{selectedRowKeys.length} selected</span>
          <Button danger loading={isDeleting} icon={<DeleteOutlined />} onClick={handleBulkDelete} size="small">Delete</Button>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={tickets.map((t) => ({ ...t, key: t.id }))}
        pagination={{ pageSize: 20 }}
        rowSelection={isAdmin ? { selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as string[]) } : undefined}
        size="small"
      />
    </div>
  )
}
