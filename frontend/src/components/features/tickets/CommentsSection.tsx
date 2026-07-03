'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { adminService } from '@/services'
import { Button, Input, Form, Empty, message, Divider, Popconfirm } from 'antd'
import { DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { formatDistanceToNow } from 'date-fns'

interface CommentData {
  id: string
  ticket_id: string
  user_id: string
  content: string
  commenter_name?: string
  created_at: string
  updated_at: string
}

interface CommentsSectionProps {
  ticketId: string
}

export default function TicketComments({ ticketId }: CommentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetchComments = useCallback(async () => {
    try {
      const response = await adminService.getTicketComments(ticketId)
      const result = response.data as any
      if (response.success && result) {
        setComments(result.comments || result.data || [])
      } else {
        message.error(response.error || 'Failed to load comments')
      }
    } catch (error) {
      message.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchComments()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchComments])

  const handleSubmit = async (values: any) => {
    if (!user) return
    setSubmitting(true)
    try {
      const content = values.content.trim()
      const response = await adminService.addTicketComment(ticketId, { content })
      const result = response.data as any

      if (response.success && result) {
        setComments((prev) => [...prev, result.comment || result])
        form.resetFields()
        message.success('Comment added')
      } else {
        throw new Error(response.error || 'Failed to post comment')
      }
    } catch (error) {
      message.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const response = await adminService.deleteComment(commentId)
      if (!response.success) throw new Error(response.error || 'Failed to delete')
      
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      message.success('Comment deleted')
    } catch (error) {
      message.error('Failed to delete comment')
    }
  }

  const avatarColor = (name: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4']
    return colors[(name?.charCodeAt(0) || 0) % colors.length]
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading comments...</div>

  return (
    <div>
      <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 16px 0' }}>
        Comments ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <Empty description={<span style={{ color: 'var(--text-tertiary)' }}>No comments yet</span>} style={{ padding: '24px 0' }} />
      ) : (
        <div style={{ marginBottom: 20 }}>
          {comments.map((comment, i) => (
            <div key={comment.id} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: i < comments.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: avatarColor(comment.commenter_name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{(comment.commenter_name || 'A').charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{comment.commenter_name || 'Anonymous'}</span>
                  <span style={{ color: 'var(--text-placeholder)', fontSize: 11 }}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{comment.content}</p>
                {(user?.id === comment.user_id || isAdmin) && (
                  <Popconfirm title="Delete comment?" onConfirm={() => handleDelete(comment.id)} okText="Yes" cancelText="No">
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} style={{ marginTop: 8, fontSize: 11, padding: 0, height: 'auto' }}>Delete</Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Divider style={{ margin: '12px 0' }} />

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item name="content" rules={[{ required: true, message: 'Please enter a comment' }]} style={{ marginBottom: 8 }}>
          <Input.TextArea
            placeholder="Add a comment..."
            rows={3}
            disabled={submitting}
            style={{ fontSize: 13 }}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={submitting} icon={<SendOutlined />} style={{ height: 32, fontSize: 13, borderRadius: 6 }}>
            Post Comment
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
