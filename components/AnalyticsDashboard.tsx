'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TicketAnalytics } from '@/lib/types'
import { TrendingUp, Clock, Users, CheckCircle } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data, error } = await supabase
          .from('tbl_ticket_analytics')
          .select('*')
          .single()

        if (error) throw error
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-slate-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  const solvedRate = analytics.total_tickets > 0
    ? ((analytics.solved_count / analytics.total_tickets) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6 mb-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={analytics.total_tickets}
          icon={<TrendingUp size={24} />}
          color="blue"
        />
        <StatCard
          title="Solved Tickets"
          value={analytics.solved_count}
          subtitle={`${solvedRate}% resolution rate`}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${analytics.avg_resolution_hours || 0}h`}
          icon={<Clock size={24} />}
          color="purple"
        />
        <StatCard
          title="Unique Users"
          value={analytics.unique_users}
          icon={<Users size={24} />}
          color="orange"
        />
      </div>

      {/* Status & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
          <div className="space-y-3">
            <ProgressBar
              label="Untouched"
              value={analytics.untouched_count}
              total={analytics.total_tickets}
              color="red"
            />
            <ProgressBar
              label="Pending"
              value={analytics.pending_count}
              total={analytics.total_tickets}
              color="yellow"
            />
            <ProgressBar
              label="Opened"
              value={analytics.opened_count}
              total={analytics.total_tickets}
              color="blue"
            />
            <ProgressBar
              label="Solved"
              value={analytics.solved_count}
              total={analytics.total_tickets}
              color="green"
            />
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Priority Breakdown</h3>
          <div className="space-y-3">
            <ProgressBar
              label="Urgent"
              value={analytics.urgent_priority}
              total={analytics.total_tickets}
              color="red"
            />
            <ProgressBar
              label="High"
              value={analytics.high_priority}
              total={analytics.total_tickets}
              color="orange"
            />
            <ProgressBar
              label="Medium"
              value={analytics.medium_priority}
              total={analytics.total_tickets}
              color="yellow"
            />
            <ProgressBar
              label="Low"
              value={analytics.low_priority}
              total={analytics.total_tickets}
              color="blue"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  )
}

interface ProgressBarProps {
  label: string
  value: number
  total: number
  color: 'red' | 'yellow' | 'blue' | 'green' | 'orange'
}

function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
