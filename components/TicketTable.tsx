'use client'

import { Ticket, Priority, Status } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { Table, Button, Tag, Space, Modal, message, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

// ============================================
// TYPE DEFINITIONS
// ============================================

interface TicketTableProps {
  tickets: Ticket[]
  onTicketsDeleted?: () => void // Callback after tickets are deleted
}

// ============================================
// CONFIGURATION OBJECTS
// ============================================

/**
 * Priority display configuration
 * Maps priority enum to color and label
 */
const priorityConfig: Record<Priority, { color: string; label: string }> = {
  LOW: { color: 'green', label: 'Low' },
  MEDIUM: { color: 'blue', label: 'Medium' },
  HIGH: { color: 'orange', label: 'High' },
  URGENT: { color: 'red', label: 'Urgent' },
}

/**
 * Status display configuration
 * Maps status enum to Ant Design tag color and label
 */
const statusConfig: Record<Status, { color: string; label: string }> = {
  UNTOUCHED: { color: 'default', label: 'Untouched' },
  PENDING: { color: 'warning', label: 'Pending' },
  OPENED: { color: 'processing', label: 'Opened' },
  SOLVED: { color: 'success', label: 'Solved' },
}

/**
 * Category color mapping for tags
 */
const categoryConfig: Record<string, string> = {
  'Bug Report': 'red',
  'Technical Issue': 'purple',
  'Account Inquiry': 'cyan',
  'New Feature Request': 'blue',
  'Other': 'default',
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * TicketTable Component
 * Displays tickets in a sortable, filterable table
 * Features:
 * - Bulk selection (admin only)
 * - Bulk delete with confirmation
 * - Clickable rows to view ticket details
 * - Color-coded priority and status tags
 * - Responsive pagination
 */
export default function TicketTable({ tickets, onTicketsDeleted }: TicketTableProps) {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const { isAdmin } = useAuthStore() // Check if current user is admin
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]) // Selected ticket IDs
  const [isDeleting, setIsDeleting] = useState(false) // Deletion in progress

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle bulk delete of selected tickets
   * Only available to admins
   * Shows confirmation modal before deleting
   */

  /**
   * Handle bulk delete of selected tickets
   * Only available to admins
   * Shows confirmation modal before deleting
   */
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return

    // Show confirmation modal
    Modal.confirm({
      title: 'Delete Tickets',
      content: `Are you sure you want to delete ${selectedRowKeys.length} ticket(s)? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsDeleting(true)
        try {
          // Get current session for authentication
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No active session')

          // Call API to delete tickets
          const response = await fetch('/api/admin/bulk-delete-tickets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ ticketIds: selectedRowKeys })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed to delete tickets')

          // Success - clear selection and refresh
          message.success(`Successfully deleted ${selectedRowKeys.length} ticket(s)`)
          setSelectedRowKeys([])
          if (onTicketsDeleted) onTicketsDeleted()
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Failed to delete tickets')
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  // ============================================
  // TABLE COLUMN DEFINITIONS
  // ============================================

  /**
   * Define table columns with custom renderers
   * Each column has sort, filter, and display logic
   */

  const columns = [
    {
      title: 'ID',
      dataIndex: 'number',
      key: 'number',
      width: 80,
      render: (number: number, record: Ticket) => (
        <Link href={`/tickets/${record.id}`} className="text-blue-500 hover:text-blue-700">
          #{number}
        </Link>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false, // Use Tooltip instead
      },
      render: (title: string, record: Ticket) => (
        <Tooltip title={title}>
          <Link href={`/tickets/${record.id}`} className="text-blue-500 hover:text-blue-700">
            {title}
          </Link>
        </Tooltip>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => <Tag color={categoryConfig[category] || 'default'}>{category}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: Priority) => (
        <Tag color={priorityConfig[priority].color}>{priorityConfig[priority].label}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Status) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true }),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 120,
      render: (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true }),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {/* Show first 2 tags, indicate if more exist */}
          {tags.slice(0, 2).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {tags.length > 2 && <span>+{tags.length - 2}</span>}
        </Space>
      ),
    },
  ]

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      {/* ============================================ */}
      {/* BULK ACTIONS BAR (Admin Only) */}
      {/* ============================================ */}
      {isAdmin && selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px', background: '#f6f8fb', borderRadius: '4px' }}>
          <Space>
            <span>{selectedRowKeys.length} ticket(s) selected</span>
            <Button
              danger
              loading={isDeleting}
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </Space>
        </div>
      )}

      {/* ============================================ */}
      {/* TICKET TABLE */}
      {/* ============================================ */}
      <Table
        columns={columns}
        dataSource={tickets.map((ticket) => ({
          ...ticket,
          key: ticket.id, // Required by Ant Design Table
        }))}
        pagination={{ pageSize: 20 }} // 20 tickets per page
        rowSelection={
          isAdmin
            ? {
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }
            : undefined // Only show checkboxes for admins
        }
        loading={false}
        scroll={{ x: 1200 }} // Horizontal scroll on small screens
      />
    </div>
  )
}
