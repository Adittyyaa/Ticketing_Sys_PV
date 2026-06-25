'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Form, Select, message, Modal, Spin } from 'antd'
import { ArrowLeft, Download, CreditCard as Edit2, Trash2, CircleCheck as CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import TicketComments from '@/components/CommentsSection'
import AttachmentsSection from '@/components/AttachmentsSection'
import { getAdminAuthHeader } from '@/lib/admin-api'
import { Ticket, Status, Priority, CustomStatus } from '@/types/types'
import { priorityDisplay, getStatusDisplay } from '@/lib/design-tokens'
import { formatDistanceToNow, format } from 'date-fns'
import jsPDF from 'jspdf'

const statusOptions: Status[] = ['UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED']
const priorityOptions: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const getUserDisplayName = (user?: { email: string; full_name?: string }, fallback = 'Unknown') => user?.full_name || user?.email || fallback

const getAssignedDisplayName = (ticket: Ticket) => {
  if (ticket.assigned_user?.full_name || ticket.assigned_user?.email) {
    return getUserDisplayName(ticket.assigned_user)
  }
  if (ticket.assigned_to) return 'Assigned user unavailable'
  return 'Unassigned'
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser, setLoading, isAdmin, setIsAdmin } = useAuthStore()
  const [form] = Form.useForm()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLocalLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { method: 'GET' })
        if (!response.ok) { router.push('/auth'); return }

        const { userId } = await response.json()
        const userResponse = await fetch('/api/admin/users/me', { method: 'GET' })
        const { user: userData } = await userResponse.json()
        const admin = userData?.role === 'admin'

        setIsAdmin(admin)
        setUser({ id: userId, email: userData?.email || '', full_name: userData?.full_name || '', role: userData?.role || 'user' })
        setLoading(false)
      } catch { router.push('/auth') }
    }
    checkAuth()
  }, [setUser, setLoading, setIsAdmin, router])

  useEffect(() => {
    if (!user) return
    const fetchTicket = async () => {
      try {
        let authHeader: string
        try {
          authHeader = await getAdminAuthHeader()
        } catch {
          await fetch('/api/auth/login', { method: 'DELETE' })
          router.push('/auth')
          return
        }
        const response = await fetch(`/api/admin/tickets/${ticketId}`, { headers: { Authorization: authHeader } })
        const result = await response.json()
        if (!response.ok) {
          if (response.status === 401) {
            await fetch('/api/auth/login', { method: 'DELETE' })
            router.push('/auth')
            return
          }
          const errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
          throw new Error(errorMessage || 'Failed to load ticket')
        }
        const data = result.ticket as Ticket
        setTicket(data)
        form.setFieldsValue({ priority: data.priority, status: data.status })
      } catch {
        message.error('Failed to load ticket')
        router.push('/tickets')
      } finally {
        setLocalLoading(false)
      }
    }
    fetchTicket()
  }, [user, isAdmin, ticketId, router, form])

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const authHeader = await getAdminAuthHeader()
        const response = await fetch('/api/admin/custom-statuses', { headers: { Authorization: authHeader } })
        const result = await response.json()
        if (result.statuses) setCustomStatuses(result.statuses.map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          is_active: s.is_active ?? true,
          sort_order: s.sort_order ?? 0,
          created_at: s.created_at
        })))
      } catch { /* silent */ }
    }
    fetchStatuses()
  }, [])

  const handleSave = async (values: { priority: Priority; status: Status }) => {
    if (!ticket) return
    try {
      const authHeader = await getAdminAuthHeader()
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ priority: values.priority, status: values.status })
      })
      if (!response.ok) throw new Error('Failed to update ticket')
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
          const authHeader = await getAdminAuthHeader()
          const response = await fetch(`/api/admin/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: { Authorization: authHeader }
          })
          if (!response.ok) throw new Error('Failed to delete ticket')
          message.success('Ticket deleted')
          router.push('/tickets')
        } catch { message.error('Failed to delete ticket') }
      }
    })
  }

  const updateStatus = async (newStatus: Status, msg: string) => {
    if (!ticket) return
    try {
      const authHeader = await getAdminAuthHeader()
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ status: newStatus })
      })
      if (!response.ok) throw new Error('Failed to update status')
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
      pdf.text(`Status: ${ticket.status}  |  Priority: ${ticket.priority}`, 15, y)
      y += 6
      pdf.text(`Category: ${ticket.category_name || 'N/A'}  |  Assigned To: ${getAssignedDisplayName(ticket)}`, 15, y)
      y += 6
      pdf.text(`Created By: ${getUserDisplayName(ticket.creator)}  |  Created: ${format(new Date(ticket.created_at), 'PPP p')}`, 15, y)
      y += 8
      if (ticket.type || ticket.product || ticket.product_reference_number) {
        pdf.text(`Type: ${ticket.type || 'None'}  |  Product: ${ticket.product || 'None'}  |  Ref: ${ticket.product_reference_number || 'None'}`, 15, y)
        y += 8
      }
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
  if (!ticket) return <AppShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}><span style={{ color: 'var(--text-tertiary)' }}>Ticket not found</span></div></AppShell>

  const p = priorityDisplay[ticket.priority]
  const s = getStatusDisplay(ticket.status, customStatuses)
  const statusDropdownOptions = customStatuses.length > 0
    ? customStatuses.map(s => ({ label: s.name, value: s.name }))
    : statusOptions.map(s => ({ label: s, value: s }))
  const assignedTo = getAssignedDisplayName(ticket)
  const createdBy = getUserDisplayName(ticket.creator)
  const tagsText = ticket.tags?.length > 0 ? ticket.tags.join(', ') : 'None'
  const commentCount = ticket.comment_count ?? 0

  return (
    <AppShell>
      <div style={{ padding: '24px 32px' }}>
        {/* Breadcrumb */}
        <Link href="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-link)', fontSize: 12, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to tickets
        </Link>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Main Content - Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title & Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 500 }}>#{ticket.number}</span>
                <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, margin: '4px 0 0 0' }}>{ticket.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {ticket.status === 'SOLVED' ? (
                  <Button onClick={() => updateStatus('OPENED', 'Reopened')} style={{ height: 32, fontSize: 12, borderRadius: 6 }}>Reopen</Button>
                ) : (
                  <Button onClick={() => updateStatus('SOLVED', 'Resolved')} type="primary" style={{ height: 32, fontSize: 12, borderRadius: 6, backgroundColor: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}>
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
              <div style={{ padding: 16, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, marginBottom: 20 }}>
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ priority: ticket.priority, status: ticket.status }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Priority</span>} name="priority" rules={[{ required: true }]}>
                      <Select style={{ height: 32 }} options={priorityOptions.map(p => ({ label: p, value: p }))} />
                    </Form.Item>
                    <Form.Item label={<span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Status</span>} name="status" rules={[{ required: true }]}>
                      <Select style={{ height: 32 }} options={statusDropdownOptions} />
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
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 8px 0' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
            </div>

            {/* Tags */}
            {ticket.tags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 8px 0' }}>Tags</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ticket.tags.map((tag) => (
                    <span key={tag} style={{ padding: '2px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 4, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{tag}</span>
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
          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>Properties</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Status</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: s.color, backgroundColor: s.bg }}>
                    {s.label}
                  </span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Priority</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: p.color }}>{p.label}</span>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Category</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{ticket.category_name || 'N/A'}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Assigned To</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{assignedTo}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Created By</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{createdBy}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Type</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{ticket.type || 'None'}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Product</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{ticket.product || 'None'}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Product Reference</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{ticket.product_reference_number || 'None'}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Tags</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{tagsText}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Comments</div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{commentCount}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Created</div>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-primary)' }}>{format(new Date(ticket.created_at), 'PPP p')}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                </div>

                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Updated</div>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-primary)' }}>{format(new Date(ticket.updated_at), 'PPP p')}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
