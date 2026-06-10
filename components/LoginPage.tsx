'use client'

import { useState } from 'react'
import { Button, Input, Card, Switch, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const handleLogin = () => {
    if (email && password) {
      message.success('Logged in successfully!')
      onLogin()
    } else {
      message.error('Please fill all fields')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          borderColor: '#E5E7EB',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎫</div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>Ticketing App</h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>User Login</p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            prefix={<UserOutlined />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            prefix={<LockOutlined />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>

        <Button type="primary" block onClick={handleLogin} style={{ height: '40px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
          Sign In
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Admin Mode</span>
          <Switch checked={isAdmin} onChange={setIsAdmin} />
        </div>
      </Card>
    </div>
  )
}
