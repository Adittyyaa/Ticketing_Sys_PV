'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button, Input, Form, Empty, message, Select, Space, Divider, AutoComplete, Popconfirm } from 'antd'
import { DeleteOutlined, SendOutlined, MessageOutlined } from '@ant-design/icons'
import { formatDistanceToNow } from 'date-fns'
import { SavedReply } from '@/types/types'

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
  ticketNumber?: number
  ticketTitle?: string
}

export default function TicketComments({ ticketId, ticketNumber, ticketTitle }: CommentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([])
  const [fetchingReplies, setFetchingReplies] = useState(false)
  const [users, setUsers] = useState<Array<{id: string, email: string, full_name?: string, role?: string}>>([])

  useEffect(() => { fetchComments() }, [ticketId])
  
  useEffect(() => {
    if (isAdmin) {
      fetchSavedReplies()
    }
    fetchUsers()
  }, [isAdmin])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase.from('tbl_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
      if (error) throw error
      setComments(data || [])
    } catch { message.error('Failed to load comments') }
    finally { setLoading(false) }
  }

  const fetchSavedReplies = async () => {
    setFetchingReplies(true)
    try {
      const { data, error } = await supabase.from('tbl_saved_replies').select('*').order('title')
      if (error) throw error
      setSavedReplies(data || [])
    } catch (err) {
      console.error('Error fetching saved replies:', err)
    } finally {
      setFetchingReplies(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('tbl_users').select('id, email, full_name, role').order('email')
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9._%+-]+)/g
    const matches = content.match(mentionRegex)
    return matches ? matches.map(m => m.substring(1).toLowerCase()) : []
  }

  const findUserByEmail = (email: string) => {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase())
  }

  const createNotifications = async (commentId: string, content: string) => {
    const mentionedEmails = extractMentions(content)
    for (const email of mentionedEmails) {
      const mentionedUser = findUserByEmail(email)
      if (mentionedUser && mentionedUser.id !== user?.id) {
        await supabase.from('tbl_notifications').insert({
          user_id: mentionedUser.id,
          ticket_id: ticketId,
          comment_id: commentId,
          type: 'mention',
          message: `${user?.email || 'Someone'} mentioned you in ticket #${ticketNumber || ticketId}`,
          ticket_number: ticketNumber,
          ticket_title: ticketTitle,
          commenter_name: user?.email
        })
      }
    }
  }

  const handleUseReply = (replyId: string) => {
    const reply = savedReplies.find(r => r.id === replyId)
    if (reply) {
      const currentContent = form.getFieldValue('content') || ''
      form.setFieldsValue({ content: currentContent ? `${currentContent}\n\n${reply.content}` : reply.content })
    }
  }

  const handleSubmit = async (values: any) => {
    if (!user) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase.from('tbl_comments').insert([{ ticket_id: ticketId, user_id: user.id, content: values.content.trim(), commenter_name: user.email, commenter_email: user.email }]).select('*').single()
      if (error) throw error
      setComments((prev) => [...prev, data])
      await createNotifications(data.id, values.content.trim())
      form.resetFields()
      message.success('Comment added')
    } catch { message.error('Failed to post comment') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from('tbl_comments').delete().eq('id', commentId)
      if (error) throw error
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      message.success('Comment deleted')
    } catch { message.error('Failed to delete comment') }
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

      {isAdmin && savedReplies.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Space>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><MessageOutlined /> Saved Reply:</span>
            <Select
              placeholder="Select a macro..."
              style={{ width: 200 }}
              size="small"
              onChange={handleUseReply}
              loading={fetchingReplies}
              value={undefined}
              dropdownMatchSelectWidth={false}
              options={savedReplies.map(r => ({ label: r.title, value: r.id }))}
            />
          </Space>
        </div>
      )}

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item name="content" rules={[{ required: true, message: 'Please enter a comment' }]} style={{ marginBottom: 8 }}>
          <AutoComplete
            style={{ width: '100%' }}
            options={users.filter(u => u.id !== user?.id).map(u => ({
              value: `@${u.email}`,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent-primary)' }}>@{u.email}</span>
                </div>
              ),
            }))}
            onSelect={(value) => {
              const currentContent = form.getFieldValue('content') || ''
              form.setFieldsValue({ content: currentContent ? `${currentContent} ${value}` : value })
            }}
            filterOption={(inputValue, option) =>
              option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
            }
          >
            <Input.TextArea placeholder="Add a comment... Use @email to mention users" rows={3} disabled={submitting} style={{ fontSize: 13 }} />
          </AutoComplete>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 4, display: 'block' }}>
            Tip: Use @email to mention users (e.g., @john@example.com)
          </span>
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
