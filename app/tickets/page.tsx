'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Typography, Card, Spin, Empty, Space } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import TicketTable from '@/components/TicketTable'
import { Ticket } from '@/lib/types'

const { Content } = Layout
const { Title, Paragraph } = Typography

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * TicketsPage Component
 * User dashboard for viewing and managing personal tickets
 * Features:
 * - Authentication verification
 * - Personal tickets only (filtered by user_id)
 * - Search functionality through FilterBar
 * - Empty state for new users
 * - Loading states with Ant Design components
 */
export default function TicketsPage() {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { setTickets, filters } = useTicketStore()
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Authentication check and user data setup
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push('/auth')
          return
        }

        // Get user role from database
        const { data: userData } = await supabase
          .from('tbl_users')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: userData?.role || 'user',
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  /**
   * Fetch user's tickets with search filtering
   */
  useEffect(() => {
    if (!user) return

    const fetchAllTickets = async () => {
      setIsLoading(true)
      try {
        // Sanitize search input for security
        const sanitizedSearch = filters.search?.trim().substring(0, 100) || ''

        // Fetch only user's tickets (privacy: users see only their tickets)
        let myQuery = supabase
          .from('tbl_tickets')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        // Apply search filter if provided
        if (sanitizedSearch) {
          myQuery = myQuery.ilike('title', `%${sanitizedSearch}%`)
        }

        const { data: myData, error: myError } = await myQuery
        if (myError) throw myError

        setMyTickets((myData || []) as Ticket[])
        setTickets((myData || []) as Ticket[]) // Update global state
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllTickets()
  }, [user, filters.search, setTickets])

  // Don't render until user is loaded
  if (!user) {
    return null
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      {/* ============================================ */}
      {/* HEADER & FILTERS */}
      {/* ============================================ */}
      <Header />
      <FilterBar />

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <Content style={{ margin: '0 auto', maxWidth: '1200px', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>
            My Tickets
          </Title>
          <Paragraph style={{ color: '#94a3b8', margin: 0 }}>
            View and manage all your support tickets
          </Paragraph>
        </div>

        {/* ============================================ */}
        {/* TICKETS TABLE */}
        {/* ============================================ */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#374151' }}>
          {isLoading ? (
            // Loading State
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Spin size="large" />
              <Paragraph style={{ color: '#94a3b8', marginTop: '16px', marginBottom: 0 }}>
                Loading tickets...
              </Paragraph>
            </div>
          ) : (
            <>
              {/* Tickets Table */}
              <TicketTable tickets={myTickets} />
              
              {/* Empty State */}
              {myTickets.length === 0 && (
                <Empty
                  image={<FileTextOutlined style={{ fontSize: '64px', color: '#64748b' }} />}
                  description={
                    <Space direction="vertical" size="small">
                      <span style={{ color: '#94a3b8', fontSize: '16px' }}>
                        No tickets found
                      </span>
                      <span style={{ color: '#64748b', fontSize: '14px' }}>
                        Create your first ticket to get started!
                      </span>
                    </Space>
                  }
                  style={{ padding: '48px 0' }}
                />
              )}
            </>
          )}
        </Card>
      </Content>
    </Layout>
  )
}
