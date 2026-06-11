'use client'

import { useEffect, useState } from 'react'
import { Progress } from 'antd'
import { supabase } from '@/lib/supabase'
import { TicketAnalytics } from '@/types/types'

export default function StatisticsDashboard() {
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data, error } = await supabase.from('tbl_ticket_analytics').select('*').single()
        if (error) throw error
        setAnalytics(data)
      } catch {
        // silently fail
      } finally { setIsLoading(false) }
    }
    fetchAnalytics()
  }, [])

  if (isLoading) return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />)}</div>
  if (!analytics) return null

  const solvedRate = analytics.total_tickets > 0 ? ((analytics.solved_count / analytics.total_tickets) * 100).toFixed(1) : 0

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { value: analytics.total_tickets, label: 'Total Tickets' },
          { value: analytics.solved_count, label: `Solved (${solvedRate}%)` },
          { value: analytics.avg_resolution_hours || 0, label: 'Avg Resolution (hrs)' },
          { value: analytics.unique_users, label: 'Unique Users' },
        ].map((m) => (
          <div key={m.label} style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, padding: 20 }}>
            <div style={{ color: '#f0f4f8', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{m.value}</div>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Status */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 600, margin: '0 0 16px 0' }}>Status Breakdown</h3>
          {[
            { label: 'Untouched', value: analytics.untouched_count, color: '#64748b' },
            { label: 'Pending', value: analytics.pending_count, color: '#f59e0b' },
            { label: 'Opened', value: analytics.opened_count, color: '#3b82f6' },
            { label: 'Solved', value: analytics.solved_count, color: '#10b981' },
          ].map((s) => (
            <div key={s.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{s.label}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{s.value}</span>
              </div>
              <Progress percent={analytics.total_tickets > 0 ? Math.round((s.value / analytics.total_tickets) * 100) : 0} strokeColor={s.color} showInfo={false} size="small" />
            </div>
          ))}
        </div>

        {/* Priority */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 600, margin: '0 0 16px 0' }}>Priority Breakdown</h3>
          {[
            { label: 'Urgent', value: analytics.urgent_priority, color: '#ef4444' },
            { label: 'High', value: analytics.high_priority, color: '#f59e0b' },
            { label: 'Medium', value: analytics.medium_priority, color: '#3b82f6' },
            { label: 'Low', value: analytics.low_priority, color: '#10b981' },
          ].map((p) => (
            <div key={p.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.label}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.value}</span>
              </div>
              <Progress percent={analytics.total_tickets > 0 ? Math.round((p.value / analytics.total_tickets) * 100) : 0} strokeColor={p.color} showInfo={false} size="small" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
