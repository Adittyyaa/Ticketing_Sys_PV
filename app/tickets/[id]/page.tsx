'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Form, Select, message, Modal, Spin } from 'antd'
import { ArrowLeft, Download, CreditCard as Edit2, Trash2, CircleCheck as CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketComments from '@/components/CommentsSection'
import AttachmentsSection from '@/components/AttachmentsSection'
import { getAdminAuthHeader } from '@/lib/admin-api'
import { Ticket, Status, Priority } from '@/types/types'
import { formatDistanceToNow, format } from 'date-fns'
import { priorityDisplay, statusDisplay } from '@/lib/design-tokens'
import jsPDF from 'jspdf'

const statusOptions: Status[] = ['UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED']
const priorityOptions: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const [form] = Form.useForm()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLocalLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/auth'); return }
        const { data: userData } = await supabase.from('tbl_users').select('role').eq('id', session.user.id).single()
        const admin = userData?.role === 'admin'
        setIsAdmin(admin)
        setUser({ id: session.user.id, email: session.user.email || '', role: userData?.role || 'user' })
        setLoading(false)
      } catch { router.push('/auth') }
    }
    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  useEffect(() => {
    if (!user) return
    const fetchTicket = async () => {
      try {
        let data: Ticket | null = null
        if (isAdmin) {
          const authHeader = await getAdminAuthHeader()
          const response = await fetch(`/api/admin/tickets/${ticketId}`, { headers: { Authorization: authHeader } })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed to load ticket')
          data = result.ticket as Ticket
        } else {
          const { data: ticketData, error } = await supabase.from('tbl_tickets').select('*').eq('id', ticketId).eq('user_id', user.id).single()
          if (error) throw error
          data = ticketData as Ticket
        }
        setTicket(data)
        form.setFieldsValue({ priority: data.priority, status: data.status })
      } catch {
        message.error('Failed to load ticket')
        router.push(isAdmin ? '/admin' : '/tickets')
      } finally {
        setLocalLoading(false)
      }
    }
    fetchTicket()
  }, [user, isAdmin, ticketId, router, form])

  const applyOwnershipFilter = <T extends { eq: (col: string, val: string) => T }>(query: T): T => {
    if (isAdmin || !user) return query
    return query.eq('user_id', user.id)
  }

  const handleSave = async (values: { priority: Priority; status: Status }) => {
    if (!ticket) return
    try {
      const { error } = await applyOwnershipFilter(supabase.from('tbl_tickets').update({ priority: values.priority, status: values.status, updated_at: new Date().toISOString() }).eq('id', ticket.id))
      if (error) throw error
      setTicket({ ...ticket, priority: values.priority, status: values.status })
      setIsEditing(false)
      message.success('Ticket updated')
    } catch { message.error('Failed to update ticket') }
  }

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Ticket',
      content: 'Are you sure? This cannot be undone.',
      okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await applyOwnershipFilter(supabase.from('tbl_tickets').delete().eq('id', ticket?.id))
          if (error) throw error
          message.success('Ticket deleted')
          router.push(isAdmin ? '/admin' : '/tickets')
        } catch { message.error('Failed to delete ticket') }
      }
    })
  }

  const updateStatus = async (newStatus: Status, msg: string) => {
    if (!ticket) return
    try {
      const { error } = await applyOwnershipFilter(supabase.from('tbl_tickets').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', ticket.id))
      if (error) throw error
      setTicket({ ...ticket, status: newStatus })
      form.setFieldsValue({ status: newStatus })
      message.success(msg)
    } catch { message.error('Failed to update status') }
  }

  const handleExportPDF = async () => {
    if (!ticket) return
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      let y = 15
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text(`Ticket #${ticket.number}`, 15, y)
      y += 10
      pdf.setFont('normal')
      pdf.setFontSize(12)
      pdf.text(ticket.title, 15, y)
      y += 15
      pdf.setFontSize(10)
      pdf.setTextColor(120, 130, 140)
      pdf.text(`Status: ${ticket.status}  |  Priority: ${ticket.priority}  |  Category: ${ticket.category}`, 15, y)
      y += 8
      pdf.text(`Created: ${format(new Date(ticket.created_at), 'PPP p')}`, 15, y)
      y += 10
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Description:', 15, y)
      y += 8
      pdf.setFont('normal')
      const lines = pdf.splitTextToSize(ticket.description, 180)
      lines.forEach((l: string) => { pdf.text(l, 15, y); y += 6 })
      pdf.save(`ticket-${ticket.number}.pdf`)
      message.success('PDF exported')
    } catch { message.error('Failed to export PDF') }
  }

  if (!user || loading) return <AppShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}><Spin size="large" /></div></AppShell>
  if (!ticket) return <AppShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}><span style={{ color: '#64748b' }}>Ticket not found</span></div></AppShell>

  const p = priorityDisplay[ticket.priority]
  const s = statusDisplay[ticket.status]

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        {/* Breadcrumb */}
        <Link href={isAdmin ? '/admin' : '/tickets'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontSize: 12, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to tickets
        </Link>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Main Content - Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title & Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>#{ticket.number}</span>
                <h1 style={{ color: '#f0f4f8', fontSize: 20, fontWeight: 600, margin: '4px 0 0 0' }}>{ticket.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {ticket.status === 'SOLVED' ? (
                  <Button onClick={() => updateStatus('OPENED', 'Reopened')} style={{ height: 32, fontSize: 12, borderRadius: 6 }}>Reopen</Button>
                ) : (
                  <Button onClick={() => updateStatus('SOLVED', 'Resolved')} type="primary" style={{ height: 32, fontSize: 12, borderRadius: 6, backgroundColor: '#10b981', borderColor: '#10b981' }}>
                    <CheckCircle size={14} style={{ marginRight: 4 }} /> Resolve
                  </Button>
                )}
                <Button onClick={() => setIsEditing(!isEditing)} icon={<Edit2 size={14} />} style={{ height: 32, fontSize: 12, borderRadius: 6 }}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                <Button onClick={handleExportPDF} icon={<Download size={14} />} style={{ height: 32, fontSize: 12, borderRadius: 6 }} />
                <Button onClick={handleDelete} danger icon={<Trash2 size={14} />} style={{ height: 32, fontSize: 12, borderRadius: 6 }} />
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div style={{ padding: 16, backgroundColor: '#1a2236', border: '1px solid #253347', borderRadius: 8, marginBottom: 20 }}>
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ priority: ticket.priority, status: ticket.status }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Priority</span>} name="priority" rules={[{ required: true }]}>
                      <Select style={{ height: 32 }}>{priorityOptions.map((p) => <Select.Option key={p} value={p}>{p}</Select.Option>)}</Select>
                    </Form.Item>
                    <Form.Item label={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Status</span>} name="status" rules={[{ required: true }]}>
                      <Select style={{ height: 32 }}>{statusOptions.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}</Select>
                    </Form.Item>
                  </div>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" style={{ height: 32, borderRadius: 6 }}>Save Changes</Button>
                  </Form.Item>
                </Form>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 600, margin: '0 0 8px 0' }}>Description</h3>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
            </div>

            {/* Tags */}
            {ticket.tags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 600, margin: '0 0 8px 0' }}>Tags</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ticket.tags.map((tag) => (
                    <span key={tag} style={{ padding: '2px 10px', backgroundColor: '#1a2236', borderRadius: 4, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <TicketComments ticketId={ticketId} />

            {/* Attachments */}
            <div style={{ marginTop: 20 }}>
              <AttachmentsSection ticketId={ticketId} />
            </div>
          </div>

          {/* Properties Panel - Right */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1e2d45', borderRadius: 8, padding: 16 }}>
              <h3 style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>Properties</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Status */}
                <div>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Status</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: s.color, backgroundColor: s.bg }}>
                    {s.label}
                  </span>
                </div>

                {/* Priority */}
                <div>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Priority</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: p.color }}>{p.label}</span>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Category</div>
                  <span style={{ fontSize: 12, color: '#f0f4f8', fontWeight: 500 }}>{ticket.category}</span>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #1e2d45' }} />

                {/* Dates */}
                <div>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Created</div>
                  <span style={{ fontSize: 12, color: '#f0f4f8' }}>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Updated</div>
                  <span style={{ fontSize: 12, color: '#f0f4f8' }}>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
