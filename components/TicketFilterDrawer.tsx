'use client'

import { useState, useEffect } from 'react'
import { Drawer, Button, Input, Select, Space, Divider, Badge, Tag } from 'antd'
import { Search, X } from 'lucide-react'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  
  // Filter values
  searchQuery: string
  statusFilter: string
  priorityFilter: string
  categoryFilter: string
  typeFilter: string
  
  // Filter setters
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onTypeChange: (value: string) => void
  
  // Data
  categories: string[]
  types: string[]
  
  // Actions
  onApply: () => void
  onReset: () => void
  
  // Applied filters count
  appliedCount: number
}

const statusOptions = [
  { label: 'Any status', value: 'all' },
  { label: 'Untouched', value: 'UNTOUCHED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Opened', value: 'OPENED' },
  { label: 'Solved', value: 'SOLVED' },
]

const priorityOptions = [
  { label: 'Any priority', value: 'all' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

export default function TicketFilterDrawer({
  open,
  onClose,
  searchQuery,
  statusFilter,
  priorityFilter,
  categoryFilter,
  typeFilter,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onTypeChange,
  categories,
  types,
  onApply,
  onReset,
  appliedCount,
}: FilterDrawerProps) {
  const [tempSearch, setTempSearch] = useState(searchQuery)
  const [tempStatus, setTempStatus] = useState(statusFilter)
  const [tempPriority, setTempPriority] = useState(priorityFilter)
  const [tempCategory, setTempCategory] = useState(categoryFilter)
  const [tempType, setTempType] = useState(typeFilter)

  // Update temp values when props change
  useEffect(() => {
    setTempSearch(searchQuery)
    setTempStatus(statusFilter)
    setTempPriority(priorityFilter)
    setTempCategory(categoryFilter)
    setTempType(typeFilter)
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, typeFilter])

  const handleApply = () => {
    onSearchChange(tempSearch)
    onStatusChange(tempStatus)
    onPriorityChange(tempPriority)
    onCategoryChange(tempCategory)
    onTypeChange(tempType)
    onApply()
    onClose()
  }

  const handleReset = () => {
    setTempSearch('')
    setTempStatus('all')
    setTempPriority('all')
    setTempCategory('all')
    setTempType('all')
    onReset()
  }

  const getAppliedFilters = () => {
    const filters: string[] = []
    if (tempSearch) filters.push(`Search: "${tempSearch}"`)
    if (tempStatus !== 'all') filters.push(`Status: ${tempStatus}`)
    if (tempPriority !== 'all') filters.push(`Priority: ${tempPriority}`)
    if (tempCategory !== 'all') filters.push(`Category: ${tempCategory}`)
    if (tempType !== 'all') filters.push(`Type: ${tempType}`)
    return filters
  }

  const appliedFilters = getAppliedFilters()

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>FILTERS</span>
          {appliedFilters.length > 0 && (
            <Button 
              type="link" 
              onClick={() => {/* Show applied filters section */}}
              style={{ fontSize: 13, color: 'var(--ant-primary-color)' }}
            >
              Show applied filters
            </Button>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      footer={
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            size="large" 
            block 
            onClick={handleApply}
            style={{ fontWeight: 600 }}
          >
            Apply
            {appliedFilters.length > 0 && (
              <Badge 
                count={appliedFilters.length} 
                style={{ marginLeft: 8, backgroundColor: '#fff', color: 'var(--ant-primary-color)' }}
              />
            )}
          </Button>
        </div>
      }
      styles={{
        body: { padding: '24px' },
        header: { borderBottom: '1px solid var(--border-subtle)', padding: '16px 24px' },
        footer: { borderTop: '1px solid var(--border-subtle)', padding: '16px 24px' }
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Search Fields */}
        <div>
          <Input
            placeholder="Search fields"
            prefix={<Search size={16} style={{ color: 'var(--text-tertiary)' }} />}
            value={tempSearch}
            onChange={(e) => setTempSearch(e.target.value)}
            size="large"
            allowClear
            style={{ borderRadius: 8 }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0 0 0' }}>
            Search by title, description, or reference number
          </p>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Status Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8 
          }}>
            Status
          </label>
          <Select
            value={tempStatus}
            onChange={setTempStatus}
            size="large"
            style={{ width: '100%' }}
            options={statusOptions}
          />
        </div>

        {/* Priority Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8 
          }}>
            Priority
          </label>
          <Select
            value={tempPriority}
            onChange={setTempPriority}
            size="large"
            style={{ width: '100%' }}
            options={priorityOptions}
          />
        </div>

        {/* Category Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8 
          }}>
            Category
          </label>
          <Select
            value={tempCategory}
            onChange={setTempCategory}
            size="large"
            style={{ width: '100%' }}
            placeholder="Any category"
          >
            <Select.Option value="all">Any category</Select.Option>
            {categories.map(cat => (
              <Select.Option key={cat} value={cat}>{cat}</Select.Option>
            ))}
          </Select>
        </div>

        {/* Type Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8 
          }}>
            Type
          </label>
          <Select
            value={tempType}
            onChange={setTempType}
            size="large"
            style={{ width: '100%' }}
            placeholder="Any type"
          >
            <Select.Option value="all">Any type</Select.Option>
            {types.map(type => (
              <Select.Option key={type} value={type}>{type}</Select.Option>
            ))}
          </Select>
        </div>

        {/* Applied Filters Preview */}
        {appliedFilters.length > 0 && (
          <>
            <Divider style={{ margin: 0 }} />
            <div>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: 'var(--text-secondary)', 
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Applied Filters</span>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleReset}
                  style={{ fontSize: 12, padding: 0 }}
                >
                  Clear all
                </Button>
              </div>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {appliedFilters.map((filter, index) => (
                  <Tag 
                    key={index}
                    closable
                    onClose={() => {
                      // Handle individual filter removal
                      if (filter.startsWith('Search:')) setTempSearch('')
                      if (filter.startsWith('Status:')) setTempStatus('all')
                      if (filter.startsWith('Priority:')) setTempPriority('all')
                      if (filter.startsWith('Category:')) setTempCategory('all')
                      if (filter.startsWith('Type:')) setTempType('all')
                    }}
                    style={{ 
                      fontSize: 12, 
                      padding: '4px 8px',
                      borderRadius: 4,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {filter}
                  </Tag>
                ))}
              </Space>
            </div>
          </>
        )}
      </Space>
    </Drawer>
  )
}
