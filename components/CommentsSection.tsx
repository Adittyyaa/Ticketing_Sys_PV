'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button, Input, Form, Avatar, Empty, Popconfirm, message, Card, Skeleton, Divider } from 'antd'
import { DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { formatDistanceToNow } from 'date-fns'

interface CommentData {
  id: string
  ticket_id: string
  user_id: string
  content: string
  commenter_name?: string
  commenter_email?: string
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

  useEffect(() => {
    fetchComments()
  }, [ticketId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('tbl_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      message.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    if (!user) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('tbl_comments')
        .insert([
          {
            ticket_id: ticketId,
            user_id: user.id,
            content: values.content.trim(),
            commenter_name: user.email,
            commenter_email: user.email,
          },
        ])
        .select('*')
        .single()

      if (error) throw error

      setComments((prev) => [...prev, data])
      form.resetFields()
      message.success('Comment added successfully')
    } catch (error) {
      console.error('Failed to post comment:', error)
      message.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('tbl_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      message.success('Comment deleted')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      message.error('Failed to delete comment')
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />

  return (
    <Card title={`Comments (${comments.length})`}>
      <div style={{ marginBottom: 24 }}>
        {comments.length === 0 ? (
          <Empty description="No comments yet" style={{ marginTop: 24 }} />
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <Avatar style={{ backgroundColor: '#3b82f6', flexShrink: 0 }}>
                  {(comment.commenter_name || 'A').charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>
                      {comment.commenter_name || 'Anonymous'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ color: '#ddd', margin: '8px 0', wordBreak: 'break-word' }}>
                    {comment.content}
                  </p>
                  {(user?.id === comment.user_id || isAdmin) && (
                    <Popconfirm
                      title="Delete comment?"
                      description="Are you sure?"
                      onConfirm={() => handleDelete(comment.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        type="text" 
                        danger 
                        size="small" 
                        icon={<DeleteOutlined />}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
              {index < comments.length - 1 && <Divider style={{ margin: '16px 0' }} />}
            </div>
          ))
        )}
      </div>

      <Divider />

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="content"
          rules={[{ required: true, message: 'Please enter a comment' }]}
        >
          <Input.TextArea
            placeholder="Add a comment..."
            rows={3}
            disabled={submitting}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SendOutlined />}
          >
            Post Comment
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
