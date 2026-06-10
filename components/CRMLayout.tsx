'use client'

import React, { useState } from 'react'
import {
  Layout,
  Menu,
  Input,
  Button,
  Avatar,
  Space,
  Dropdown,
  Badge,
  Tag,
  Modal,
} from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  LineChartOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

interface CRMLayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

const menuItems = [
  {
    key: 'overview',
    icon: <DashboardOutlined />,
    label: 'OVERVIEW',
    children: [
      { key: 'dashboard', label: 'Sales Pipeline' },
    ],
  },
  {
    key: 'leads',
    label: 'LEADS',
  },
  {
    key: 'pipeline',
    icon: <LineChartOutlined />,
    label: 'PIPELINE',
  },
  {
    key: 'analytics',
    icon: <LineChartOutlined />,
    label: 'ANALYTICS',
  },
]

const userMenuItems = [
  {
    key: 'profile',
    label: 'Profile Settings',
    icon: <SettingOutlined />,
  },
  {
    key: 'logout',
    label: 'Logout',
    icon: <LogoutOutlined />,
    danger: true,
  },
]

export const CRMLayout: React.FC<CRMLayoutProps> = ({
  children,
  currentPage,
  onPageChange,
}) => {
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = (e: any) => {
    if (e.key === 'dashboard') {
      onPageChange('dashboard')
    } else if (e.key === 'deal-detail') {
      onPageChange('deal-detail')
    }
  }

  const handleUserMenuClick = (e: any) => {
    if (e.key === 'logout') {
      Modal.confirm({
        title: 'Logout',
        content: 'Are you sure you want to logout?',
        okText: 'Yes',
        cancelText: 'No',
        onOk() {
          onPageChange('login')
        },
      })
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #e5e7eb',
        }}
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Stellar CRM
          </div>
          <Tag color="blue">Enterprise</Tag>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: '#FFFFFF', border: 'none' }}
        />
      </Sider>

      <Layout style={{ backgroundColor: '#F9FAFB' }}>
        <Header
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Space size="large" style={{ flex: 1 }}>
            <Button
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', color: '#6b7280' }}
            >
              {collapsed ? '☰' : '☰'}
            </Button>
            <Input
              placeholder="Search deals, clients..."
              prefix="🔍"
              style={{
                width: '300px',
                borderRadius: '6px',
              }}
              suffix="⌘K"
            />
          </Space>

          <Space size="large">
            <Badge count={3} offset={[-5, 5]}>
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: '16px', color: '#6b7280' }}
              />
            </Badge>
            <Button
              type="text"
              icon={<SettingOutlined />}
              style={{ fontSize: '16px', color: '#6b7280' }}
            />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={32} style={{ backgroundColor: '#3b82f6' }} icon={<UserOutlined />} />
                <span style={{ color: '#111827', fontWeight: '500' }}>Alex Mercer</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            padding: '24px',
            backgroundColor: '#F9FAFB',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
