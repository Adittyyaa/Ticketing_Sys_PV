'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { AppShell } from '@/components/app/AppShell'
import { CommentsSection } from '@/components/app/CommentsSection'
import { AttachmentsSection } from '@/components/app/AttachmentsSection'
import { getAdminAuthHeader } from '@/lib/admin-api'
import { priorityStyles, statusStyles } from '@/lib/ui'
import type { Ticket, Status, Priority } from '@/types/types'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import {
  ArrowLeft,
  FileDown,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react'

const STATUS_OPTIONS: Status[] = ['UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED']
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

function TicketDetail() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const { user, isAdmin } = useAuthStore()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM')
  const [editStatus, setEditStatus] = useState<Status>('UNTOUCHED')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    if (!user) return
    const fetchTicket = async () => {
      try {
        let data: Ticket | null = null
        if (isAdmin) {
          const authHeader = await getAdminAuthHeader()
          const res = await fetch(`/api/admin/tickets/${ticketId}`, {
            headers: { Authorization: authHeader },
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || 'Failed to load ticket')
          data = result.ticket as Ticket
        } else {
          const { data: t, error } = await supabase
            .from('tbl_tickets')
            .select('*')
            .eq('id', ticketId)
            .eq('user_id', user.id)
            .single()
          if (error) throw error
          data = t as Ticket
        }
        setTicket(data)
        setEditPriority(data.priority)
        setEditStatus(data.status)
      } catch (err) {
        console.error('[v0] Failed to fetch ticket:', err)
        router.push(isAdmin ? '/admin' : '/tickets')
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [user, isAdmin, ticketId, router])

  const ownershipScoped = <T extends { eq: (c: string, v: string) => T }>(q: T): T => {
    if (isAdmin || !user) return q
    return q.eq('user_id', user.id)
  }

  const persist = async (changes: Partial<Ticket>, successMsg: string) => {
    if (!ticket) return
    try {
      const { error } = await ownershipScoped(
        supabase
          .from('tbl_tickets')
          .update({ ...changes, updated_at: new Date().toISOString() })
          .eq('id', ticket.id)
      )
      if (error) throw error
      setTicket({ ...ticket, ...changes })
      notify(successMsg)
    } catch (err) {
      console.error('[v0] Failed to update ticket:', err)
      notify('Failed to update ticket')
    }
  }

  const handleSave = async () => {
    await persist({ priority: editPriority, status: editStatus }, 'Ticket updated')
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!ticket) return
    try {
      const { error } = await ownershipScoped(
        supabase.from('tbl_tickets').delete().eq('id', ticket.id)
      )
      if (error) throw error
      router.push(isAdmin ? '/admin' : '/tickets')
    } catch (err) {
      console.error('[v0] Failed to delete ticket:', err)
      notify('Failed to delete ticket')
    }
  }

  const handleExportPDF = () => {
    if (!ticket) return
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 15
      let y = margin
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text(`Ticket #${ticket.number}`, margin, y)
      y += 10
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(ticket.title, margin, y)
      y += 12
      pdf.setFontSize(10)
      ;[
        `Status: ${ticket.status}`,
        `Priority: ${ticket.priority}`,
        `Category: ${ticket.category}`,
        `Created: ${format(new Date(ticket.created_at), 'PPP p')}`,
        `Updated: ${format(new Date(ticket.updated_at), 'PPP p')}`,
      ].forEach((line) => {
        pdf.text(line, margin, y)
        y += 7
      })
      y += 4
      pdf.setFont('helvetica', 'bold')
      pdf.text('Description:', margin, y)
      y += 7
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(ticket.description || '', 180)
      lines.forEach((line: string) => {
        pdf.text(line, margin, y)
        y += 6
      })
      pdf.save(`ticket-${ticket.number}.pdf`)
      notify('PDF exported')
    } catch (err) {
      console.error('[v0] Failed to export PDF:', err)
      notify('Failed to export PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="py-24 text-center text-sm text-muted">Ticket not found.</div>
    )
  }

  const isSolved = ticket.status === 'SOLVED'

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
      <Link
        href={isAdmin ? '/admin' : '/tickets'}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {isAdmin ? 'dashboard' : 'tickets'}
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            <span className="text-faint">#{ticket.number}</span> {ticket.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Opened {format(new Date(ticket.created_at), 'PPP')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={() =>
              persist(
                { status: isSolved ? 'OPENED' : 'SOLVED' },
                isSolved ? 'Marked as unresolved' : 'Marked as resolved'
              )
            }
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white ${
              isSolved ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSolved ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {isSolved ? 'Unresolve' : 'Mark Resolved'}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Priority</label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as Status)}
              className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={handleSave}
              className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Metadata pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        <MetaPill label="Priority" value={ticket.priority} className={priorityStyles[ticket.priority]} />
        <MetaPill label="Status" value={ticket.status} className={statusStyles[ticket.status]} />
        <MetaPill
          label="Category"
          value={ticket.category}
          className="border-brand/20 bg-brand-soft text-brand"
        />
      </div>

      {/* Description */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
        <div className="rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </section>

      {/* Tags */}
      {ticket.tags?.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-ink">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {ticket.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      <CommentsSection ticketId={ticketId} />
      <AttachmentsSection ticketId={ticketId} />

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setConfirmDelete(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-xl">
            <h3 className="text-base font-semibold text-ink">Delete ticket?</h3>
            <p className="mt-1.5 text-sm text-muted">
              This action cannot be undone. The ticket and its data will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function MetaPill({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
      <span className="text-xs font-medium text-faint">{label}</span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
      >
        {value}
      </span>
    </div>
  )
}

export default function TicketDetailPage() {
  return (
    <AppShell>
      <TicketDetail />
    </AppShell>
  )
}
