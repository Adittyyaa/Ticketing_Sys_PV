'use client'

import { Select, Button, Divider } from 'antd'
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState } from 'react'

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FilterState {
  agents: string[]
  groups: string[]
  created: string
  dueBy: string
  skill: string[]
  status: string[]
  priority: string[]
  type: string[]
  source: string[]
}

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void
  onReset?: () => void
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * FilterSidebar Component
 * Right-side filter panel similar to Helpdesk
 * Features:
 * - Multiple filter categories
 * - Dropdown selectors
 * - Date range pickers
 * - Reset functionality
 * - Collapsible sections
 */
export default function FilterSidebar({ onFilterChange, onReset }: FilterSidebarProps) {
  // ============================================
  // STATE
  // ============================================
  
  const [filters, setFilters] = useState<FilterState>({
    agents: [],
    groups: [],
    created: 'any',
    dueBy: 'any',
    skill: [],
    status: ['all_unresolved'],
    priority: [],
    type: [],
    source: [],
  })

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Update filter state and notify parent
   */
  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  /**
   * Reset all filters to default
   */
  const handleReset = () => {
    const defaultFilters: FilterState = {
      agents: [],
      groups: [],
      created: 'any',
      dueBy: 'any',
      skill: [],
      status: ['all_unresolved'],
      priority: [],
      type: [],
      source: [],
    }
    setFilters(defaultFilters)
    onReset?.()
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#0f172a',
        borderLeft: '1px solid #334155',
        padding: '20px 16px',
        overflowY: 'auto',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#f1f5f9',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            <FilterOutlined />
            <span>FILTERS</span>
          </div>
          <Button
            type="text"
            size="small"
            icon={<SearchOutlined />}
            style={{ color: '#94a3b8' }}
          />
        </div>
      </div>

      {/* Agents Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Agents
        </label>
        <Select
          mode="multiple"
          placeholder="Any"
          value={filters.agents}
          onChange={(value) => updateFilter('agents', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'All Agents', value: 'all' },
            { label: 'Sheena S Adrian', value: 'sheena' },
            { label: 'Rachel (Acme Corp)', value: 'rachel' },
            { label: 'Will Graham', value: 'will' },
            { label: 'Abid K (Sauls)', value: 'abid' },
            { label: 'Ruby Tully', value: 'ruby' },
          ]}
          suffixIcon={<span style={{ fontSize: '10px' }}>▼</span>}
        />
      </div>

      {/* Groups Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Groups
        </label>
        <Select
          mode="multiple"
          placeholder="Any"
          value={filters.groups}
          onChange={(value) => updateFilter('groups', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Support Team', value: 'support' },
            { label: 'Sales Team', value: 'sales' },
            { label: 'Technical Team', value: 'technical' },
            { label: 'Logistics Team', value: 'logistics' },
          ]}
        />
      </div>

      {/* Created Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Created
        </label>
        <Select
          placeholder="Any time"
          value={filters.created}
          onChange={(value) => updateFilter('created', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Any time', value: 'any' },
            { label: 'Today', value: 'today' },
            { label: 'Yesterday', value: 'yesterday' },
            { label: 'Last 7 days', value: 'week' },
            { label: 'Last 30 days', value: 'month' },
            { label: 'Custom range', value: 'custom' },
          ]}
        />
      </div>

      {/* Due By Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Due by
        </label>
        <Select
          placeholder="Any"
          value={filters.dueBy}
          onChange={(value) => updateFilter('dueBy', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Any', value: 'any' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Today', value: 'today' },
            { label: 'Tomorrow', value: 'tomorrow' },
            { label: 'This week', value: 'week' },
            { label: 'Next week', value: 'next_week' },
          ]}
        />
      </div>

      {/* Skill Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Skill
        </label>
        <Select
          mode="multiple"
          placeholder="Any"
          value={filters.skill}
          onChange={(value) => updateFilter('skill', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Technical Support', value: 'technical' },
            { label: 'Customer Service', value: 'customer_service' },
            { label: 'Billing', value: 'billing' },
            { label: 'Sales', value: 'sales' },
          ]}
        />
      </div>

      <Divider style={{ borderColor: '#334155', margin: '16px 0' }} />

      {/* Status Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Status
        </label>
        <Select
          mode="multiple"
          placeholder="All unresolved"
          value={filters.status}
          onChange={(value) => updateFilter('status', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'All unresolved', value: 'all_unresolved' },
            { label: 'Untouched', value: 'UNTOUCHED' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Opened', value: 'OPENED' },
            { label: 'Solved', value: 'SOLVED' },
          ]}
        />
      </div>

      {/* Priority Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Priority
        </label>
        <Select
          mode="multiple"
          placeholder="Any"
          value={filters.priority}
          onChange={(value) => updateFilter('priority', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Low', value: 'LOW' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'High', value: 'HIGH' },
            { label: 'Urgent', value: 'URGENT' },
          ]}
        />
      </div>

      {/* Type Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Type
        </label>
        <Select
          mode="multiple"
          placeholder="Any"
          value={filters.type}
          onChange={(value) => updateFilter('type', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Bug Report', value: 'bug' },
            { label: 'Technical Issue', value: 'technical' },
            { label: 'Feature Request', value: 'feature' },
            { label: 'Account Inquiry', value: 'account' },
            { label: 'Other', value: 'other' },
          ]}
        />
      </div>

      {/* Source Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          color: '#94a3b8', 
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Source
        </label>
        <Select
          mode="multiple"
          placeholder="Any"
          value={filters.source}
          onChange={(value) => updateFilter('source', value)}
          style={{ width: '100%' }}
          size="middle"
          options={[
            { label: 'Email', value: 'email' },
            { label: 'Portal', value: 'portal' },
            { label: 'Phone', value: 'phone' },
            { label: 'Chat', value: 'chat' },
            { label: 'API', value: 'api' },
          ]}
        />
      </div>

      {/* Reset Button */}
      <Button
        type="default"
        icon={<ReloadOutlined />}
        onClick={handleReset}
        style={{ 
          width: '100%',
          marginTop: '8px',
          borderColor: '#334155',
          color: '#94a3b8'
        }}
      >
        Reset Filters
      </Button>
    </div>
  )
}
