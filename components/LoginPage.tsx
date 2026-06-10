'use client'

import React, { useState } from 'react'
import { Card, Form, Input, Button, Row, Col, Segmented, Typography, Space } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface LoginPageProps {
  onLogin: () => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'standard' | 'sso'>('standard')
  const [error, setError] = useState('')

  const handleLogin = async (values: any) => {
    setError('')
    setLoading(true)
    
    // Simulate login
    setTimeout(() => {
      if (values.email && values.password) {
        setLoading(false)
        onLogin()
      } else {
        setError('Please enter valid credentials')
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        padding: '20px',
      }}
    >
      <Card
        style={{
          maxWidth: '400px',
          width: '100%',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Stellar CRM
          </div>
          <Text type="secondary">Enterprise Deal Management</Text>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Text style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '12px' }}>
            Authentication Method
          </Text>
          <Segmented
            value={authMode}
            onChange={(value) => setAuthMode(value as 'standard' | 'sso')}
            options={['Standard Login', 'SSO']}
            block
          />
        </div>

        {authMode === 'standard' ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your work email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                placeholder="Work Email"
                prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                size="large"
                style={{ borderRadius: '6px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                placeholder="Password"
                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                size="large"
                style={{ borderRadius: '6px' }}
              />
            </Form.Item>

            {error && (
              <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '6px',
                  fontWeight: '600',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              block
              size="large"
              style={{
                backgroundColor: '#1f2937',
                borderRadius: '6px',
                fontWeight: '600',
              }}
            >
              Sign In with SSO
            </Button>
            <Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: '12px' }}>
              Redirecting to your identity provider...
            </Text>
          </Space>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Don&apos;t have an account? <a href="#signup">Request Access</a>
          </Text>
        </div>
      </Card>
    </div>
  )
}
