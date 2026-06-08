'use client'

import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Progress } from 'antd'
import { ArrowUpOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { TicketAnalytics } from '@/lib/types'

export default function StatisticsDashboard() {
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card loading />
          </Col>
        ))}
      </Row>
    )
  }

  if (!analytics) return null

  const solvedRate = analytics.total_tickets > 0
    ? ((analytics.solved_count / analytics.total_tickets) * 100).toFixed(1)
    : 0

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={analytics.total_tickets}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Solved Tickets"
              value={analytics.solved_count}
              suffix={`(${solvedRate}%)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Resolution"
              value={analytics.avg_resolution_hours || 0}
              suffix="hrs"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Unique Users"
              value={analytics.unique_users}
            />
          </Card>
        </Col>
      </Row>

      {/* Status & Priority Breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Status Breakdown">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Untouched</span>
                <span>{analytics.untouched_count}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.untouched_count / analytics.total_tickets) * 100)} 
                strokeColor="#f5222d"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending</span>
                <span>{analytics.pending_count}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.pending_count / analytics.total_tickets) * 100)} 
                strokeColor="#faad14"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Opened</span>
                <span>{analytics.opened_count}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.opened_count / analytics.total_tickets) * 100)} 
                strokeColor="#1890ff"
              />
            </div>
            <div>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Solved</span>
                <span>{analytics.solved_count}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.solved_count / analytics.total_tickets) * 100)} 
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Priority Breakdown">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Urgent</span>
                <span>{analytics.urgent_priority}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.urgent_priority / analytics.total_tickets) * 100)} 
                strokeColor="#f5222d"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>High</span>
                <span>{analytics.high_priority}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.high_priority / analytics.total_tickets) * 100)} 
                strokeColor="#fa8c16"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Medium</span>
                <span>{analytics.medium_priority}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.medium_priority / analytics.total_tickets) * 100)} 
                strokeColor="#faad14"
              />
            </div>
            <div>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Low</span>
                <span>{analytics.low_priority}</span>
              </div>
              <Progress 
                percent={Math.round((analytics.low_priority / analytics.total_tickets) * 100)} 
                strokeColor="#1890ff"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
