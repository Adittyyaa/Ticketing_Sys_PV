'use client'

import { Button, Select, Input, Table, Card, Statistic, Progress, Row, Col, Tabs } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

export default function AdminDashboard({ onSelectTicket }: { onSelectTicket: () => void }) {

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (text: string) => <span style={{ color: text === 'High' ? '#ef4444' : '#f59e0b' }}>{text}</span> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: text === 'Solved' ? '#d1fae5' : '#fef3c7',
            color: text === 'Solved' ? '#047857' : '#b45309',
            fontSize: '12px',
          }}
        >
          {text}
        </span>
      ),
    },
    { title: 'Created', dataIndex: 'created', key: 'created', width: 100 },
  ]

  const data = [
    { id: '#1', title: 'Login Issue', category: 'Bug', priority: 'High', status: 'Solved', created: '2024-01-10' },
    { id: '#2', title: 'Dashboard Not Loading', category: 'Technical', priority: 'High', status: 'Pending', created: '2024-01-11' },
    { id: '#3', title: 'Feature Request', category: 'Feature', priority: 'Medium', status: 'Opened', created: '2024-01-12' },
    { id: '#4', title: 'API Error', category: 'Bug', priority: 'High', status: 'Untouched', created: '2024-01-13' },
  ]

  return (
    <div style={{ padding: '32px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px', fontWeight: 700 }}>Ticket Management</h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Monitor and manage all support tickets</p>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button type="default">Export CSV</Button>
        <Button type="default">+ Add Ticket</Button>
        <Button type="primary">+ Add User</Button>
      </div>

      <Card style={{ marginBottom: '24px', borderColor: '#E5E7EB' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Input placeholder="Search tickets..." style={{ width: '200px' }} />
          <Select style={{ width: '150px' }} placeholder="Category" options={[{ label: 'Bug', value: 'bug' }]} />
          <Select style={{ width: '150px' }} placeholder="Status" options={[{ label: 'Solved', value: 'solved' }]} />
          <Button type="primary" icon={<SearchOutlined />}>
            Search
          </Button>
        </div>
      </Card>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Tickets" value={1250} valueStyle={{ color: '#1f2937' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Solved Tickets" value={987} valueStyle={{ color: '#059669' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Avg Resolution" value="2.5h" valueStyle={{ color: '#1f2937' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Unique Users" value={452} valueStyle={{ color: '#1f2937' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Status Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[{ label: 'Untouched', value: 30 }, { label: 'Pending', value: 45 }, { label: 'Opened', value: 20 }, { label: 'Solved', value: 79 }].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: '12px', marginBottom: '4px', color: '#6b7280' }}>{item.label}</div>
                  <Progress percent={item.value} size="small" strokeColor="#1f2937" />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Priority Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[{ label: 'Critical', value: 10, color: '#ef4444' }, { label: 'High', value: 35, color: '#f97316' }, { label: 'Medium', value: 45, color: '#f59e0b' }, { label: 'Low', value: 10, color: '#10b981' }].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: '12px', marginBottom: '4px', color: '#6b7280' }}>{item.label}</div>
                  <Progress percent={item.value} size="small" strokeColor={item.color} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Tickets">
        <Tabs
          items={[
            {
              key: 'my',
              label: 'My Tickets',
              children: (
                <Table
                  columns={columns}
                  dataSource={data.map((d, i) => ({ ...d, key: i }))}
                  pagination={{ pageSize: 10, total: 100 }}
                  onRow={() => ({ onClick: onSelectTicket, style: { cursor: 'pointer' } })}
                />
              ),
            },
            {
              key: 'other',
              label: 'Other Tickets',
              children: (
                <Table
                  columns={columns}
                  dataSource={data.map((d, i) => ({ ...d, key: i }))}
                  pagination={{ pageSize: 10, total: 100 }}
                  onRow={() => ({ onClick: onSelectTicket, style: { cursor: 'pointer' } })}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
