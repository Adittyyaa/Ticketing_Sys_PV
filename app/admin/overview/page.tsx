'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { getAdminAuthHeader } from '@/lib/admin-api'
import { Ticket } from '@/types/types'
import { Button, Spin, message, Space } from 'antd'
import FeedbackModal from '@/components/FeedbackModal'

export default function AdminOverviewPage() {
  const router = useRouter()
  const { isAdmin } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  
  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    if (!isAdmin) { router.push('/tickets'); return }
    
    const fetchOverviewData = async () => {
      try {
        const authHeader = await getAdminAuthHeader()
        const response = await fetch('/api/admin/tickets', { headers: { Authorization: authHeader } })
        const result = await response.json()
        if (response.ok) {
          setTickets(result.tickets || [])
        } else {
          message.error(result.error || 'Failed to fetch tickets')
        }
      } catch {
        message.error('Error loading dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOverviewData()
  }, [isAdmin, router])

  if (loading) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}>
        <Spin size="large" />
      </div>
    </AppShell>
  )

  // Optimized calculations with single iteration
  const { total, closed, open, resolutionRate, statusCounts, priorityCounts, categories } = (() => {
    let total = tickets.length
    let closed = 0
    const status = { UNTOUCHED: 0, PENDING: 0, OPENED: 0, SOLVED: 0 }
    const priority = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
    const cats: { [key: string]: number } = {}
    
    tickets.forEach(t => {
      if (t.status === 'SOLVED') closed++
      status[t.status as keyof typeof status]++
      priority[t.priority as keyof typeof priority]++
      const cat = t.category_name || 'Other'
      cats[cat] = (cats[cat] || 0) + 1
    })
    
    return {
      total,
      closed,
      open: total - closed,
      resolutionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
      statusCounts: status,
      priorityCounts: priority,
      categories: cats
    }
  })()

  // Status donut chart SVG helper
  const statusData = [
    { name: 'Untouched', count: statusCounts.UNTOUCHED, color: '#64748b' },
    { name: 'Pending', count: statusCounts.PENDING, color: '#f59e0b' },
    { name: 'Opened', count: statusCounts.OPENED, color: '#3b82f6' },
    { name: 'Solved', count: statusCounts.SOLVED, color: '#10b981' },
  ].filter(s => s.count > 0)

  let cumulativeCircumference = 0
  const radius = 50
  const circumference = 2 * Math.PI * radius

  return (
    <AppShell>
      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: 0 }}>Overview</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0 0' }}>Real-time ticket metrics and performance analytics</p>
          </div>
          <Space>
            <Button onClick={() => router.push('/tickets')}>View Tickets</Button>
            <Button type="primary" onClick={() => setShowFeedback(true)} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>+ Feedback</Button>
          </Space>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Tickets', value: total, color: 'var(--text-primary)', border: 'var(--border-subtle)' },
            { label: 'Open Tickets', value: open, color: 'var(--accent-warning)', border: 'rgba(245, 158, 11, 0.2)' },
            { label: 'Closed Tickets', value: closed, color: 'var(--accent-success)', border: 'rgba(16, 185, 129, 0.2)' },
            { label: 'Resolution Rate', value: `${resolutionRate}%`, color: 'var(--accent-primary)', border: 'rgba(59, 130, 246, 0.2)' },
          ].map((card, i) => (
            <div key={i} style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: `1px solid ${card.border}`, 
              borderRadius: 8, 
              padding: 20,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: card.color, marginTop: 8 }}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Charts Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* Status Breakdown (Donut SVG) */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, width: '100%', textAlign: 'left', marginBottom: 16 }}>Status Breakdown</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, width: '100%', flex: 1 }}>
              <div style={{ position: 'relative', width: 130, height: 130 }}>
                <svg width="130" height="130" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--bg-elevated)" strokeWidth="12" />
                  {statusData.length > 0 ? (
                    statusData.map((seg) => {
                      const pct = seg.count / total
                      const strokeLength = pct * circumference
                      const offset = circumference - strokeLength + cumulativeCircumference
                      cumulativeCircumference += strokeLength
                      return (
                        <circle
                          key={seg.name}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={`${strokeLength} ${circumference}`}
                          strokeDashoffset={offset}
                          transform="rotate(-90 60 60)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      )
                    })
                  ) : (
                    <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--text-placeholder)" strokeWidth="12" />
                  )}
                  <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="700">{total}</text>
                  <text x="60" y="72" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontWeight="600" letterSpacing="0.5px">TOTAL</text>
                </svg>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Untouched', count: statusCounts.UNTOUCHED, color: '#64748b' },
                  { name: 'Pending', count: statusCounts.PENDING, color: '#f59e0b' },
                  { name: 'Opened', count: statusCounts.OPENED, color: '#3b82f6' },
                  { name: 'Solved', count: statusCounts.SOLVED, color: '#10b981' }
                ].map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority Breakdown (Bar CSS) */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Priority Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 130, paddingBottom: 8, flex: 1 }}>
              {[
                { label: 'Low', count: priorityCounts.LOW, color: 'var(--accent-success)' },
                { label: 'Medium', count: priorityCounts.MEDIUM, color: 'var(--accent-primary)' },
                { label: 'High', count: priorityCounts.HIGH, color: 'var(--accent-warning)' },
                { label: 'Urgent', count: priorityCounts.URGENT, color: 'var(--accent-error)' },
              ].map(p => {
                const maxPriority = Math.max(...Object.values(priorityCounts), 1)
                const heightPercent = (p.count / maxPriority) * 80
                return (
                  <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{p.count}</span>
                    <div style={{
                      width: 24,
                      height: `${Math.max(heightPercent, 4)}px`,
                      backgroundColor: p.color,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }} />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category Breakdown (Horizontal Bars) */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Category Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(categories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cat, count]) => {
                const maxCategory = Math.max(...Object.values(categories), 1)
                const widthPercent = (count / maxCategory) * 100
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cat}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{count} ticket{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${widthPercent}%`, height: '100%', backgroundColor: '#7c3aed', borderRadius: 3, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )
              })}
            {Object.keys(categories).length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)' }}>No category data available</div>
            )}
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      </div>
    </AppShell>
  )
}
