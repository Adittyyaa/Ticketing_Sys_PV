'use client'

import { useEffect, useState } from 'react'
import { Layout, Typography, Card, Button, Spin, Space } from 'antd'
import { ReloadOutlined, BugOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Content } = Layout
const { Title, Text } = Typography

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * DebugPage Component
 * Development tool for debugging authentication and user data
 * Features:
 * - Session information display
 * - Database user record verification
 * - Role function testing
 * - JSON data visualization
 * - Refresh functionality for testing
 */
export default function DebugPage() {
  // ============================================
  // STATE
  // ============================================
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Check user authentication and database records
   * Tests various auth-related functions
   */
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('Session:', session?.user)

        if (!session?.user) {
          setData({ error: 'Not logged in' })
          setLoading(false)
          return
        }

        // Try to get user from database
        const { data: userData, error: userError } = await supabase
          .from('tbl_users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('User data:', userData)
        console.log('User error:', userError)

        // Also try calling the RLS function directly
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role')

        console.log('Role from function:', roleData)
        console.log('Role error:', roleError)

        setData({
          session: session.user,
          dbUser: userData,
          dbError: userError?.message,
          roleData: roleData,
          roleError: roleError?.message,
        })
      } catch (error) {
        console.error('Error:', error)
        setData({ error: error })
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Refresh debug data
   */
  const handleRefresh = () => {
    window.location.reload()
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text style={{ color: '#94a3b8' }}>Loading debug data...</Text>
          </Space>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      <Content style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* ============================================ */}
        {/* PAGE HEADER */}
        {/* ============================================ */}
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>
              <BugOutlined style={{ marginRight: '12px' }} />
              Debug: User & Role Data
            </Title>
            <Text style={{ color: '#94a3b8' }}>
              Development tool for debugging authentication and user database records
            </Text>
          </div>

          {/* ============================================ */}
          {/* DEBUG DATA DISPLAY */}
          {/* ============================================ */}
          <Card 
            style={{ backgroundColor: '#111827', borderColor: '#374151' }}
            bodyStyle={{ padding: '24px' }}
          >
            <pre style={{ 
              backgroundColor: '#1f2937', 
              color: '#f3f4f6',
              padding: '16px', 
              borderRadius: '8px', 
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              border: '1px solid #374151'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Card>

          {/* ============================================ */}
          {/* ACTIONS */}
          {/* ============================================ */}
          <div>
            <Button 
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="large"
            >
              Refresh Debug Data
            </Button>
          </div>
        </Space>
      </Content>
    </Layout>
  )
}
