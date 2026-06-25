'use client'

import { useState, useEffect } from 'react'
import { Drawer, Button, Input, Select, Space, Badge, Tag } from 'antd'
import { Search, X as XIcon } from 'lucide-react'

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
}: FilterDrawerProps) {
  const [tempSearch, setTempSearch] = useState(searchQuery)
  const [tempStatus, setTempStatus] = useState(statusFilter)
  const [tempPriority, setTempPriority] = useState(priorityFilter)
  const [tempCategory, setTempCategory] = useState(categoryFilter)
  const [tempType, setTempType] = useState(typeFilter)
  const [showAppliedFilters, setShowAppliedFilters] = useState(false)

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
  }

  const handleReset = () => {
    setTempSearch('')
    setTempStatus('all')
    setTempPriority('all')
    setTempCategory('all')
    setTempType('all')
    onReset()
    setShowAppliedFilters(false)
  }

  const getAppliedFilters = () => {
    const filters: Array<{ key: string; label: string }> = []
    if (tempSearch) filters.push({ key: 'search', label: `Search: "${tempSearch}"` })
    if (tempStatus !== 'all') filters.push({ key: 'status', label: `Status: ${tempStatus}` })
    if (tempPriority !== 'all') filters.push({ key: 'priority', label: `Priority: ${tempPriority}` })
    if (tempCategory !== 'all') filters.push({ key: 'category', label: `Category: ${tempCategory}` })
    if (tempType !== 'all') filters.push({ key: 'type', label: `Type: ${tempType}` })
    return filters
  }

  const appliedFilters = getAppliedFilters()

  const removeFilter = (key: string) => {
    switch (key) {
      case 'search':
        setTempSearch('')
        break
      case 'status':
        setTempStatus('all')
        break
      case 'priority':
        setTempPriority('all')
        break
      case 'category':
        setTempCategory('all')
        break
      case 'type':
        setTempType('all')
        break
    }
  }

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={open}
      width={420}
      closeIcon={null}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' },
        header: { display: 'none' },
        footer: { borderTop: '1px solid var(--border-subtle)', padding: '16px 24px' }
      }}
      footer={
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            block 
            onClick={handleReset}
            style={{ fontWeight: 500 }}
          >
            Clear
          </Button>
          <Button 
            type="primary" 
            block 
            onClick={handleApply}
            style={{ fontWeight: 600 }}
          >
            Apply
            {appliedFilters.length > 0 && (
              <Badge 
                count={appliedFilters.length} 
                style={{ marginLeft: 8, backgroundColor: '#ff4d4f', color: '#fff' }}
              />
            )}
          </Button>
        </div>
      }
    >
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: 0 }}>FILTERS</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-tertiary)',
              padding: 0,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XIcon size={20} />
          </button>
        </div>
        {appliedFilters.length > 0 && (
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <button 
              onClick={() => setShowAppliedFilters(!showAppliedFilters)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'var(--ant-primary-color)',
                fontWeight: 500,
                padding: 0
              }}
            >
              Show applied filters
            </button>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <button 
              onClick={handleReset}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'var(--ant-primary-color)',
                fontWeight: 500,
                padding: 0
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Applied Filters Display */}
      {showAppliedFilters && appliedFilters.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {appliedFilters.map((filter) => (
              <Tag
                key={filter.key}
                closable
                onClose={() => removeFilter(filter.key)}
                style={{ 
                  fontSize: 12, 
                  borderRadius: 4,
                  padding: '4px 8px'
                }}
              >
                {filter.label}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          {/* Search Field */}
          <div>
            <Input
              placeholder="Search fields"
              prefix={<Search size={16} style={{ color: 'var(--text-tertiary)' }} />}
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              size="large"
              allowClear
              style={{ 
                borderRadius: 8,
                borderColor: 'var(--border-strong)'
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 600, 
              color: 'var(--text-secondary)', 
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
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
              fontSize: 12, 
              fontWeight: 600, 
              color: 'var(--text-secondary)', 
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
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
              fontSize: 12, 
              fontWeight: 600, 
              color: 'var(--text-secondary)', 
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Category
            </label>
              <Select
                value={tempCategory}
                onChange={setTempCategory}
                size="large"
                style={{ width: '100%' }}
                placeholder="Any category"
                options={[{ value: 'all', label: 'Any category' }, ...categories.map(cat => ({ value: cat, label: cat }))]}
              />
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 600, 
              color: 'var(--text-secondary)', 
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Type
            </label>
            <Select
              value={tempType}
              onChange={setTempType}
              size="large"
              style={{ width: '100%' }}
              placeholder="Any type"
               options={[{ value: 'all', label: 'Any type' }, ...types.map(type => ({ value: type, label: type }))]}
             />
          </div>
        </Space>
      </div>
    </Drawer>
  )
}
