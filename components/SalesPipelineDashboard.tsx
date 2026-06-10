'use client'

import React, { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Input,
  Select,
  Table,
  Tabs,
  Badge,
  Progress,
  Tag,
  Typography,
  Statistic,
} from 'antd'
import {
  DownloadOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { Deal, DealStage } from '@/types/crm'
import { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface SalesPipelineDashboardProps {
  onDealClick: (dealId: string) => void
}

// Mock data
const mockDeals: Deal[] = [
  {
    id: '1',
    dealId: '#DL-902',
    clientName: 'Acme Corp',
    stage: 'Negotiation',
    value: 85000,
    expectedCloseDate: '2024-07-15',
    confidence: 'High',
    owner: 'Alex Mercer',
    source: 'Inbound',
    scope: 'Enterprise License',
    createdAt: '2024-06-01',
    updatedAt: '2024-06-10',
  },
  {
    id: '2',
    dealId: '#DL-901',
    clientName: 'TechStart Inc',
    stage: 'Proposal',
    value: 42000,
    expectedCloseDate: '2024-07-01',
    confidence: 'Medium',
    owner: 'Sarah Chen',
    source: 'Referral',
    scope: 'Professional Plan',
    createdAt: '2024-05-20',
    updatedAt: '2024-06-09',
  },
  {
    id: '3',
    dealId: '#DL-900',
    clientName: 'Global Solutions',
    stage: 'Qualified',
    value: 125000,
    expectedCloseDate: '2024-08-30',
    confidence: 'High',
    owner: 'Mike Johnson',
    source: 'Outbound',
    scope: 'Custom Integration',
    createdAt: '2024-06-05',
    updatedAt: '2024-06-10',
  },
  {
    id: '4',
    dealId: '#DL-899',
    clientName: 'Innovation Labs',
    stage: 'Prospecting',
    value: 35000,
    expectedCloseDate: '2024-09-15',
    confidence: 'Low',
    owner: 'Alex Mercer',
    source: 'Inbound',
    scope: 'Starter Package',
    createdAt: '2024-06-08',
    updatedAt: '2024-06-10',
  },
  {
    id: '5',
    dealId: '#DL-898',
    clientName: 'Enterprise Pro',
    stage: 'Won',
    value: 250000,
    expectedCloseDate: '2024-06-01',
    confidence: 'High',
    owner: 'Sarah Chen',
    source: 'Partner',
    scope: 'Enterprise Plus',
    createdAt: '2024-04-15',
    updatedAt: '2024-06-01',
  },
]

const stageColors: Record<DealStage, string> = {
  'Prospecting': '#f59e0b',
  'Qualified': '#3b82f6',
  'Negotiation': '#8b5cf6',
  'Proposal': '#ec4899',
  'Won': '#10b981',
  'Lost': '#ef4444',
}

const calculateStagePercentage = () => {
  const stageCounts = {
    Prospecting: 2,
    Qualified: 3,
    Negotiation: 2,
    Proposal: 1,
    Won: 1,
    Lost: 0,
  }
  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0)
  return Object.entries(stageCounts).map(([stage, count]) => ({
    stage,
    percentage: (count / total) * 100,
  }))
}

export const SalesPipelineDashboard: React.FC<SalesPipelineDashboardProps> = ({
  onDealClick,
}) => {
  const [filterStage, setFilterStage] = useState<string | undefined>(undefined)
  const [filterOwner, setFilterOwner] = useState<string | undefined>(undefined)
  const [filterQuarter, setFilterQuarter] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState('my-deals')

  const filteredDeals = mockDeals.filter((deal) => {
    if (filterStage && deal.stage !== filterStage) return false
    if (filterOwner && deal.owner !== filterOwner) return false
    if (filterQuarter) {
      // Simple quarter filter for demo
      return true
    }
    if (activeTab === 'my-deals' && deal.owner !== 'Alex Mercer') return false
    return true
  })

  const totalPipelineValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0)
  const dealsWon = mockDeals.filter((d) => d.stage === 'Won').length
  const totalDeals = mockDeals.length
  const winRate = ((dealsWon / totalDeals) * 100).toFixed(1)
  const activeLeads = mockDeals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').length

  const columns: ColumnsType<Deal> = [
    {
      title: 'Deal ID',
      dataIndex: 'dealId',
      key: 'dealId',
      width: 100,
      render: (text) => <span style={{ fontWeight: '600', color: '#111827' }}>{text}</span>,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      width: 120,
      render: (stage: DealStage) => (
        <Tag color={stageColors[stage]} style={{ color: '#fff' }}>
          {stage}
        </Tag>
      ),
    },
    {
      title: 'Deal Value',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (value) => `$${(value / 1000).toFixed(0)}K`,
    },
    {
      title: 'Expected Close',
      dataIndex: 'expectedCloseDate',
      key: 'expectedCloseDate',
      width: 140,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence) => {
        const colors: Record<string, string> = {
          High: '#10b981',
          Medium: '#f59e0b',
          Low: '#ef4444',
        }
        return (
          <Badge
            color={colors[confidence]}
            text={confidence}
          />
        )
      },
    },
  ]

  const stagePercentages = calculateStagePercentage()

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ marginBottom: '4px', color: '#111827' }}>
              Sales Pipeline
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Manage and track your active deals and sales opportunities
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                style={{ borderRadius: '6px', borderColor: '#d1d5db' }}
              >
                Export Pipeline
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  borderColor: '#1f2937',
                }}
              >
                + New Lead
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  backgroundColor: '#10b981',
                  borderRadius: '6px',
                  borderColor: '#10b981',
                }}
              >
                + Create Deal
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Metrics Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Total Pipeline Value"
              value={totalPipelineValue}
              prefix="$"
              suffix="K"
              valueStyle={{ color: '#1f2937', fontSize: '24px', fontWeight: '600' }}
              formatter={(value) => `${(Number(value) / 1000).toFixed(0)}`}
            />
            <div style={{ marginTop: '12px' }}>
              <Progress
                percent={100}
                strokeColor="#3b82f6"
                showInfo={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Deals Won"
              value={dealsWon}
              valueStyle={{ color: '#10b981', fontSize: '24px', fontWeight: '600' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              This quarter
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Win Rate"
              value={winRate}
              suffix="%"
              valueStyle={{ color: '#f59e0b', fontSize: '24px', fontWeight: '600' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last 90 days
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Active Leads"
              value={activeLeads}
              valueStyle={{ color: '#8b5cf6', fontSize: '24px', fontWeight: '600' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              In pipeline
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Stage Breakdown */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Title level={4} style={{ marginBottom: '16px', color: '#111827' }}>
          Deal Pipeline Breakdown
        </Title>
        <Row gutter={[16, 8]}>
          {stagePercentages.map((item) => (
            <Col key={item.stage} xs={24} sm={12} lg={4}>
              <div style={{ marginBottom: '8px' }}>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  {item.stage}
                </Text>
              </div>
              <Progress
                percent={item.percentage}
                strokeColor={stageColors[item.stage as DealStage]}
                showInfo={false}
                size={[0, 8]}
              />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Filter Bar */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Space style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input.Search
            placeholder="Search deals or clients..."
            style={{ width: '200px', borderRadius: '6px' }}
          />
          <Select
            placeholder="Deal Stage"
            style={{ width: '150px' }}
            value={filterStage}
            onChange={setFilterStage}
            allowClear
            options={[
              { label: 'Prospecting', value: 'Prospecting' },
              { label: 'Qualified', value: 'Qualified' },
              { label: 'Negotiation', value: 'Negotiation' },
              { label: 'Proposal', value: 'Proposal' },
              { label: 'Won', value: 'Won' },
              { label: 'Lost', value: 'Lost' },
            ]}
          />
          <Select
            placeholder="Deal Owner"
            style={{ width: '150px' }}
            value={filterOwner}
            onChange={setFilterOwner}
            allowClear
            options={[
              { label: 'Alex Mercer', value: 'Alex Mercer' },
              { label: 'Sarah Chen', value: 'Sarah Chen' },
              { label: 'Mike Johnson', value: 'Mike Johnson' },
            ]}
          />
          <Select
            placeholder="Closing Quarter"
            style={{ width: '150px' }}
            value={filterQuarter}
            onChange={setFilterQuarter}
            allowClear
            options={[
              { label: 'Q2 2024', value: 'q2' },
              { label: 'Q3 2024', value: 'q3' },
              { label: 'Q4 2024', value: 'q4' },
            ]}
          />
        </Space>
      </Card>

      {/* Data Table with Tabs */}
      <Card style={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'my-deals',
              label: 'My Deals',
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredDeals}
                  rowKey="id"
                  pagination={{ pageSize: 10, position: ['bottomRight'] }}
                  onRow={(record) => ({
                    onClick: () => onDealClick(record.id),
                    style: { cursor: 'pointer' },
                  })}
                  style={{ marginTop: '16px' }}
                />
              ),
            },
            {
              key: 'team-deals',
              label: 'Team Deals',
              children: (
                <Table
                  columns={columns}
                  dataSource={mockDeals}
                  rowKey="id"
                  pagination={{ pageSize: 10, position: ['bottomRight'] }}
                  onRow={(record) => ({
                    onClick: () => onDealClick(record.id),
                    style: { cursor: 'pointer' },
                  })}
                  style={{ marginTop: '16px' }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
