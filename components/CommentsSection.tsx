'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button, Input, Form, Empty, message, Divider, AutoComplete, Popconfirm } from 'antd'
import { DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { formatDistanceToNow } from 'date-fns'
import type { SavedReply } from '@/types/types'

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

type RangeTuple = [number, number] | null

export default function TicketComments({ ticketId, ticketNumber, ticketTitle }: CommentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([])
  const [users, setUsers] = useState<Array<{id: string, email: string, full_name?: string, role?: string}>>([])
  const [searchValue, setSearchValue] = useState('')
  const [dropdownOptions, setDropdownOptions] = useState<Array<{value: string, label: React.ReactNode}>>([])
  const [activeRange, setActiveRange] = useState<RangeTuple>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const getActiveToken = (value: string, cursorPosition: number) => {
    const beforeCursor = value.slice(0, cursorPosition)
    const tokenMatch = beforeCursor.match(/(?:^|\s)([#\/][^\s]*)$/)

    if (!tokenMatch) return null

    const token = tokenMatch[1]
    const start = cursorPosition - token.length
    const end = cursorPosition

    return {
      token,
      type: token.startsWith('#') ? 'mention' : token.startsWith('/r') ? 'reply' : null,
      query: token.startsWith('/r') ? token.slice(2) : token.slice(1),
      start,
      end,
    }
  }

  useEffect(() => { fetchComments() }, [ticketId])

  useEffect(() => {
    if (isAdmin) {
      fetchSavedReplies()
    }
    fetchUsers()
  }, [isAdmin, user?.id])

  useEffect(() => {
    const inputValue = form.getFieldValue('content') || ''
    const el = textAreaRef.current
    const cursorPos = el ? el.selectionStart ?? inputValue.length : inputValue.length
    const active = getActiveToken(inputValue, cursorPos)

    if (!active || active.type === null) {
      setActiveRange(null)
      setDropdownOptions([])
      return
    }

    setActiveRange([active.start, active.end])

    if (active.type === 'mention') {
      const filteredUsers = users.filter(u => u.id !== user?.id && u.email.toLowerCase().includes(active.query.toLowerCase()))
      setDropdownOptions(filteredUsers.map(u => ({
        value: `#${u.email}`,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent-primary)' }}>#{u.email}</span>
          </div>
        )
      })))
    } else if (active.type === 'reply') {
      const filteredReplies = savedReplies.filter(r => r.title.toLowerCase().includes(active.query.toLowerCase()))
      setDropdownOptions(filteredReplies.map(r => ({
        value: `/r ${r.title}`,
        label: (
          <div style={{ padding: '4px 0' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>/r</span>
            <span style={{ color: 'var(--text-primary)' }}> {r.title}</span>
          </div>
        )
      })))
    }
  }, [searchValue, savedReplies, users, user?.id, form])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase.from('tbl_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
      if (error) throw error
      setComments(data || [])
    } catch { message.error('Failed to load comments') }
    finally { setLoading(false) }
  }

  const fetchSavedReplies = async () => {
    try {
      const { data, error } = await supabase.from('tbl_saved_replies').select('*').order('title')
      if (error) throw error
      setSavedReplies(data || [])
    } catch (err) {
      console.error('Error fetching saved replies:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('tbl_users').select('id, email, full_name, role').order('email')
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      if (user?.id) {
        const { data: upsertData } = await supabase.from('tbl_users').upsert([{
          id: user.id,
          email: user.email || '',
          full_name: user.email || '',
          role: 'user',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' }]).select()
        if (upsertData) setUsers([upsertData[0] as any])
      }
    }
  }

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /#([a-zA-Z0-9._%+-]+)/g
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

  const handleSelect = (value: string) => {
    const currentContent = form.getFieldValue('content') || ''
    const range = activeRange ?? [currentContent.length, currentContent.length]
    const [start, end] = range

    if (value.startsWith('/r ')) {
      const replyTitle = value.substring(3)
      const actualReply = savedReplies.find(r => r.title === replyTitle)
      if (actualReply) {
        const before = currentContent.slice(0, start)
        const after = currentContent.slice(end)
        form.setFieldsValue({ content: before + actualReply.content + after })
      }
    } else if (value.startsWith('#')) {
      const before = currentContent.slice(0, start)
      const after = currentContent.slice(end)
      form.setFieldsValue({ content: before + value + after })
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

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item name="content" rules={[{ required: true, message: 'Please enter a comment' }]} style={{ marginBottom: 8 }}>
          <AutoComplete
            style={{ width: '100%' }}
            options={dropdownOptions}
            onSearch={(value) => setSearchValue(value)}
            onSelect={handleSelect}
            open={dropdownOptions.length > 0}
          >
              <Input.TextArea
                ref={(node) => { (textAreaRef as any).current = node }}
                placeholder="Add a comment... Use #email to mention users, /r to use saved replies"
                rows={3}
                disabled={submitting}
                style={{ fontSize: 13 }}
              />
          </AutoComplete>
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
