'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button, Input, Form, Avatar, Empty, Popconfirm, message, Card, Skeleton, Divider } from 'antd'
import { DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Comment data structure from database
 */
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

/**
 * Props for TicketComments component
 */
interface CommentsSectionProps {
  ticketId: string
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * TicketComments Component
 * Displays and manages comments for a specific ticket
 * Features:
 * - View all comments in chronological order
 * - Add new comments with form validation
 * - Delete own comments (or any comment if admin)
 * - Real-time comment display with user avatars
 */
export default function TicketComments({ ticketId }: CommentsSectionProps) {
  // ============================================
  // STATE & HOOKS
  // ============================================
  
  const { user, isAdmin } = useAuthStore() // Get current user and admin status
  const [comments, setComments] = useState<CommentData[]>([]) // List of comments
  const [loading, setLoading] = useState(true) // Initial loading state
  const [submitting, setSubmitting] = useState(false) // Comment submission state
  const [form] = Form.useForm() // Ant Design form instance

  // ============================================
  // EFFECTS
  // ============================================
  
  /**
   * Load comments when component mounts or ticketId changes
   */
  useEffect(() => {
    fetchComments()
  }, [ticketId])

  // ============================================
  // API FUNCTIONS
  // ============================================

  /**
   * Fetch all comments for this ticket from database
   * Orders by creation date (oldest first)
   */
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

  /**
   * Handle new comment submission
   * Adds comment to database and updates local state
   */
  const handleSubmit = async (values: any) => {
    if (!user) return

    setSubmitting(true)
    try {
      // Insert new comment into database
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

      // Add new comment to local state
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

  /**
   * Delete a comment from database
   * Only allow if user owns comment or is admin
   */
  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('tbl_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // Remove from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      message.success('Comment deleted')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      message.error('Failed to delete comment')
    }
  }

  // ============================================
  // RENDER
  // ============================================

  // Show skeleton loader while fetching comments
  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />

  return (
    <Card title={`Comments (${comments.length})`}>
      {/* ============================================ */}
      {/* COMMENTS LIST */}
      {/* ============================================ */}
      <div style={{ marginBottom: 24 }}>
        {comments.length === 0 ? (
          // Empty state when no comments exist
          <Empty description="No comments yet" style={{ marginTop: 24 }} />
        ) : (
          // Render each comment
          comments.map((comment, index) => (
            <div key={comment.id}>
              {/* Single Comment Container */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {/* User Avatar - First letter of name */}
                <Avatar style={{ backgroundColor: '#3b82f6', flexShrink: 0 }}>
                  {(comment.commenter_name || 'A').charAt(0).toUpperCase()}
                </Avatar>
                
                {/* Comment Content */}
                <div style={{ flex: 1 }}>
                  {/* Header: Name and timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>
                      {comment.commenter_name || 'Anonymous'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {/* Comment text */}
                  <p style={{ color: '#ddd', margin: '8px 0', wordBreak: 'break-word' }}>
                    {comment.content}
                  </p>
                  
                  {/* Delete button - only show to comment owner or admin */}
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
              
              {/* Divider between comments (not after last comment) */}
              {index < comments.length - 1 && <Divider style={{ margin: '16px 0' }} />}
            </div>
          ))
        )}
      </div>

      <Divider />

      {/* ============================================ */}
      {/* NEW COMMENT FORM */}
      {/* ============================================ */}
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {/* Comment input field */}
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

        {/* Submit button */}
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
