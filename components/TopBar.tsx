'use client'

import { Popover, Empty, Badge } from 'antd'
import { Bell, LogOut, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AccountDetailsModal from './AccountDetailsModal'
import ThemeToggle from './ThemeToggle'
import FeedbackModal from './FeedbackModal'
import { useNotificationStore } from '@/lib/notification-store'
import { formatDistanceToNow } from 'date-fns'

export default function TopBar() {
  const { user, isAdmin } = useAuthStore()
  const router = useRouter()
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore()

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id)
    }
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tbl_notifications', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          useNotificationStore.getState().addNotification(payload.new as any)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearNotifications()
    router.push('/auth')
  }

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Notifications ({unreadCount} unread)</span>
        {unreadCount > 0 && (
          <span onClick={markAllAsRead} style={{ color: 'var(--accent-primary)', fontSize: 11, cursor: 'pointer' }}>
            Mark all read
          </span>
        )}
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '24px 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No notifications</span>}
          />
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                backgroundColor: n.is_read ? 'transparent' : 'var(--bg-elevated)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Bell size={14} style={{ color: 'var(--accent-primary)', marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: n.is_read ? 400 : 600 }}>
                    {n.message}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 4 }}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <header
        style={{
          height: 56,
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12,
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <ThemeToggle size="middle" />

        <button
          onClick={() => setShowFeedbackModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          title="Send Feedback"
        >
          <MessageSquare size={18} />
        </button>

        <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
          overlayInnerStyle={{ padding: 0 }}
          onOpenChange={(open) => {
            if (open && unreadCount > 0) {
              markAllAsRead()
            }
          }}
        >
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <Badge count={unreadCount} size="small" offset={[-4, 4]}>
              <Bell size={18} />
            </Badge>
          </button>
        </Popover>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {user && (
          <div
            onClick={() => setShowAccountModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>
                {user.email}
              </div>
              <div style={{ color: 'var(--accent-primary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>
                {isAdmin ? 'Admin' : 'User'}
              </div>
            </div>
          </div>
        )}

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </header>

      <AccountDetailsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  )
}