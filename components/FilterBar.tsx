'use client'

import { Input, Select, Button, Space, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useTicketStore } from '@/lib/store'
import Link from 'next/link'

export default function TicketFilterBar() {
  const { filters, setFilters } = useTicketStore()

  return (
    <div style={{ background: '#111827', borderBottom: '1px solid #374151', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', margin: 0 }}>
          Ticket Management
        </h2>
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

      <Space wrap size="middle" style={{ width: '100%' }}>
        <Input
          placeholder="Search tickets..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          style={{ width: '250px' }}
        />

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

        <DatePicker 
          placeholder="From Date"
          style={{ width: '150px' }}
        />

        <DatePicker 
          placeholder="To Date"
          style={{ width: '150px' }}
        />

        <Button type="primary" icon={<SearchOutlined />}>
          Search
        </Button>
      </Space>
    </div>
  )
}
