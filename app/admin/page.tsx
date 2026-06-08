'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Typography, Alert, Tabs, Space, Button, Card, Spin, Empty, Badge } from 'antd'
import { UserOutlined, TeamOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import TicketTable from '@/components/TicketTable'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import ExportButton from '@/components/ExportButton'
import { Ticket } from '@/lib/types'
import Link from 'next/link'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * AdminDashboard Component
 * Administrator dashboard for managing all tickets and users
 * Features:
 * - Admin-only access with role verification
 * - Analytics dashboard with ticket statistics
 * - Tabbed view: My Tickets vs Other Users' Tickets
 * - Bulk ticket operations and export
 * - User and admin management links
 * - Auto-profile creation for new admins
 */
export default function AdminDashboard() {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const { setTickets, filters } = useTicketStore()
  const [activeTab, setActiveTab] = useState<'my' | 'others'>('my')
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [otherTickets, setOtherTickets] = useState<Ticket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketError, setTicketError] = useState<string | null>(null)

  // ============================================
  // EFFECTS
  // ============================================

  // Helper: Create user profile if it doesn't exist
  const createUserProfile = async (session: any) => {
    const { data: newUser, error } = await supabase
      .from('tbl_users')
      .insert([
        {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || '',
          role: 'user',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Failed to create user profile:', error)
      return null
    }
    return newUser
  }

  // Helper: Verify user has admin role
  const verifyAdminRole = async (userId: string) => {
    let { data: userData, error } = await supabase
      .from('tbl_users')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .single()

    // Create profile if doesn't exist (safety check)
    if (error?.code === 'PGRST116') {
      const session = await supabase.auth.getSession()
      userData = await createUserProfile(session.data.session)
      if (!userData) return false
    } else if (error) {
      console.error('User data fetch error:', error)
      return false
    }

    // Check if user is admin
    return userData?.role === 'admin'
  }

  /**
   * Authentication and admin role verification
   * Auto-creates user profile if doesn't exist
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

        // Verify admin role
        const isUserAdmin = await verifyAdminRole(session.user.id)
        if (!isUserAdmin) {
          router.push('/tickets')
          return
        }

        // Set admin user
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'admin',
        })
        setIsAdmin(true)
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  /**
   * Fetch all tickets and update them when filters change
   */
  useEffect(() => {
    fetchAllTickets()
  }, [user, isAdmin, filters.search, setTickets])

  // ============================================
  // API FUNCTIONS
  // ============================================

  // Helper: Build ticket query with search filter
  const buildTicketQuery = () => {
    let query = supabase
      .from('tbl_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    return query
  }

  // Helper: Separate tickets by ownership
  const separateTicketsByOwnership = (allTickets: Ticket[], userId: string) => {
    const myTickets = allTickets.filter(ticket => ticket.user_id === userId)
    const otherTickets = allTickets.filter(ticket => ticket.user_id !== userId)
    return { myTickets, otherTickets }
  }

  /**
   * Fetch all tickets for admin dashboard
   * Separates into "my tickets" and "other users' tickets"
   */
  const fetchAllTickets = async () => {
    if (!user || !isAdmin) return

    setIsLoadingTickets(true)
    setTicketError(null)

    try {
      const query = buildTicketQuery()
      const { data, error } = await query

      if (error) {
        console.error('RLS or query error:', error)
        setTicketError(error.message)
        throw error
      }

      const allTickets = (data || []) as Ticket[]
      
      const { myTickets: my, otherTickets: others } = separateTicketsByOwnership(allTickets, user.id)
      
      setMyTickets(my)
      setOtherTickets(others)
      setTickets(allTickets)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      setTicketError(error instanceof Error ? error.message : 'Failed to fetch tickets')
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack)
      }
    } finally {
      setIsLoadingTickets(false)
    }
  }

  // Don't render until auth is complete
  if (!user || !isAdmin) {
    return null
  }

  const displayedTickets = activeTab === 'my' ? myTickets : otherTickets

  // ============================================
  // RENDER
  // ============================================

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      {/* ============================================ */}
      {/* HEADER & ADMIN INDICATOR */}
      {/* ============================================ */}
      <Header />
      
      {/* Admin Dashboard Indicator */}
      <div style={{ 
        backgroundColor: '#1e3a8a', 
        borderBottom: '1px solid #3b82f6', 
        padding: '12px 24px' 
      }}>
        <Text style={{ color: '#93c5fd', fontSize: '14px' }}>
          ADMIN DASHBOARD - Managing all tickets
        </Text>
      </div>

      <FilterBar />

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <Content style={{ margin: '0 auto', maxWidth: '1200px', padding: '24px' }}>
        {/* Error Alert */}
        {ticketError && (
          <Alert
            message="Error loading tickets"
            description={
              <div>
                <div>{ticketError}</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                  Check browser console for more details.
                </div>
              </div>
            }
            type="error"
            style={{ marginBottom: '24px' }}
            showIcon
          />
        )}

        {/* ============================================ */}
        {/* ANALYTICS DASHBOARD */}
        {/* ============================================ */}
        <AnalyticsDashboard />

        {/* ============================================ */}
        {/* TABS AND ACTION BUTTONS */}
        {/* ============================================ */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#374151' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            {/* Tab Navigation */}
            <Tabs 
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as 'my' | 'others')}
              type="card"
            >
              <TabPane 
                tab={
                  <span>
                    <UserOutlined />
                    My Tickets
                    <Badge 
                      count={myTickets.length} 
                      style={{ backgroundColor: '#374151', marginLeft: '8px' }}
                    />
                  </span>
                } 
                key="my" 
              />
              <TabPane 
                tab={
                  <span>
                    <TeamOutlined />
                    Other Tickets
                    <Badge 
                      count={otherTickets.length} 
                      style={{ backgroundColor: '#374151', marginLeft: '8px' }}
                    />
                  </span>
                } 
                key="others" 
              />
            </Tabs>

            {/* Action Buttons */}
            <Space>
              <ExportButton tickets={displayedTickets} />
              <Link href="/admin/manage-admins">
                <Button 
                  type="primary" 
                  icon={<SettingOutlined />}
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                >
                  Manage Admins
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                >
                  Add User
                </Button>
              </Link>
            </Space>
          </div>

          {/* ============================================ */}
          {/* TICKET TABLE */}
          {/* ============================================ */}
          <div>
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              {activeTab === 'my' ? 'Tickets Raised by Me' : 'Tickets Raised by Other Users'}
            </Title>
            
            {isLoadingTickets ? (
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
                <TicketTable tickets={displayedTickets} onTicketsDeleted={fetchAllTickets} />
                
                {/* Empty State */}
                {displayedTickets.length === 0 && (
                  <Empty
                    description={
                      <span style={{ color: '#94a3b8' }}>
                        No tickets found in this category
                      </span>
                    }
                    style={{ padding: '48px 0' }}
                  />
                )}
              </>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  )
}
