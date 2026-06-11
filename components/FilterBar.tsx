'use client'

import { Input, Select, Button, Space, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useTicketStore } from '@/lib/store'
import Link from 'next/link'

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * TicketFilterBar Component
 * Provides search and filtering controls for tickets
 * Features:
 * - Text search across ticket fields
 * - Filter by status, priority
 * - Date range filtering
 * - Quick action: Create new ticket
 */
export default function TicketFilterBar() {
  // Get filter state from global store
  const { filters, setFilters } = useTicketStore()

  return (
    <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '24px' }}>
      {/* ============================================ */}
      {/* HEADER ROW */}
      {/* ============================================ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          Ticket Management
        </h2>
        {/* Create ticket button */}
        <Link href="/tickets/new">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
          >
            Add Ticket
          </Button>
        </Link>
      </div>

      {/* ============================================ */}
      {/* FILTER CONTROLS */}
      {/* ============================================ */}
      <Space wrap size="middle" style={{ width: '100%' }}>
        {/* Text search input */}
        <Input
          placeholder="Search tickets..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          style={{ width: '250px' }}
        />

        {/* Status filter dropdown */}
        <Select
          placeholder="Status"
          defaultValue="all"
          style={{ width: '150px' }}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Untouched', value: 'UNTOUCHED' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Opened', value: 'OPENED' },
            { label: 'Solved', value: 'SOLVED' },
          ]}
        />

        {/* Priority filter dropdown */}
        <Select
          placeholder="Priority"
          defaultValue="all"
          style={{ width: '150px' }}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Low', value: 'LOW' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'High', value: 'HIGH' },
            { label: 'Urgent', value: 'URGENT' },
          ]}
        />

        {/* Date range pickers */}
        <DatePicker 
          placeholder="From Date"
          style={{ width: '150px' }}
        />

        <DatePicker 
          placeholder="To Date"
          style={{ width: '150px' }}
        />

        {/* Apply filters button */}
        <Button type="primary" icon={<SearchOutlined />}>
          Search
        </Button>
      </Space>
    </div>
  )
}
