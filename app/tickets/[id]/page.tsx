'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Header from '@/components/Header'
import { ArrowLeft, Edit2, Trash2, Download } from 'lucide-react'
import Link from 'next/link'
import { Ticket, Status, Priority } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import CommentsSection from '@/components/CommentsSection'
import AttachmentsSection from '@/components/AttachmentsSection'

const statusOptions: Status[] = ['UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED']
const priorityOptions: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-green-900 text-green-200',
  MEDIUM: 'bg-blue-900 text-blue-200',
  HIGH: 'bg-yellow-900 text-yellow-200',
  URGENT: 'bg-red-900 text-red-200',
}

const statusColors: Record<Status, string> = {
  UNTOUCHED: 'bg-slate-700 text-slate-200',
  PENDING: 'bg-yellow-900 text-yellow-200',
  OPENED: 'bg-green-900 text-green-200',
  SOLVED: 'bg-blue-900 text-blue-200',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLocalLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Ticket>>({})

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

        setUser({
          id: session.user.id,
          email: session.user.email || '',
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  useEffect(() => {
    if (!user) return

    const fetchTicket = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setTicket(data as Ticket)
        setEditData(data)
      } catch (error) {
        console.error('Failed to fetch ticket:', error)
        router.push('/tickets')
      } finally {
        setLocalLoading(false)
      }
    }

    fetchTicket()
  }, [user, ticketId, router])

  const handleSave = async () => {
    if (!ticket) return

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          ...editData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)
        .eq('user_id', user?.id)

      if (error) throw error

      setTicket({ ...ticket, ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update ticket:', error)
      alert('Failed to update ticket')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket?')) return

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticket?.id).eq('user_id', user?.id)

      if (error) throw error

      router.push('/tickets')
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      alert('Failed to delete ticket')
    }
  }

  const handleMarkResolved = async () => {
    if (!ticket) return

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'SOLVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)
        .eq('user_id', user?.id)

      if (error) throw error

      setTicket({ ...ticket, status: 'SOLVED' })
    } catch (error) {
      console.error('Failed to mark as resolved:', error)
      alert('Failed to mark as resolved')
    }
  }

  const handleMarkUnresolved = async () => {
    if (!ticket) return

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'OPENED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)
        .eq('user_id', user?.id)

      if (error) throw error

      setTicket({ ...ticket, status: 'OPENED' })
    } catch (error) {
      console.error('Failed to mark as unresolved:', error)
      alert('Failed to mark as unresolved')
    }
  }

  const handleExportPDF = async () => {
    if (!ticket) return

    try {
      const element = document.getElementById('ticket-content')
      if (!element) return

      // Use jsPDF with better text-based approach
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      let yPosition = margin

      // Add logo at top
      try {
        const logoImg = document.querySelector('img[src="/logo.jpeg"]') as HTMLImageElement
        if (logoImg) {
          pdf.addImage(logoImg.src, 'JPEG', margin, yPosition, 25, 25)
          yPosition += 30
        }
      } catch (e) {
        console.log('Logo not added')
      }

      // Set font for header
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(16)
      pdf.text(`Ticket #${ticket.number}`, margin, yPosition)
      yPosition += 10

      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')
      pdf.text(`${ticket.title}`, margin, yPosition)
      yPosition += 15

      // Add metadata
      pdf.setFontSize(10)
      pdf.setTextColor(120, 130, 140)
      pdf.text(`Generated on: ${format(new Date(), 'PPP p')}`, margin, yPosition)
      yPosition += 8

      // Reset text color
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(11)
      pdf.setFont(undefined, 'bold')

      // Add ticket details
      yPosition += 5
      pdf.text('Ticket Details:', margin, yPosition)
      yPosition += 8

      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(10)

      const detailsText = [
        `Status: ${ticket.status}`,
        `Priority: ${ticket.priority}`,
        `Category: ${ticket.category}`,
        `Created: ${format(new Date(ticket.created_at), 'PPP p')}`,
        `Last Updated: ${format(new Date(ticket.updated_at), 'PPP p')}`,
      ]

      detailsText.forEach((text) => {
        if (yPosition > pageWidth - 20) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(text, margin + 5, yPosition)
        yPosition += 7
      })

      yPosition += 5
      pdf.setFont(undefined, 'bold')
      pdf.text('Description:', margin, yPosition)
      yPosition += 8

      // Add description with word wrap
      pdf.setFont(undefined, 'normal')
      const descriptionLines = pdf.splitTextToSize(ticket.description, pageWidth - margin * 2)
      descriptionLines.forEach((line: string) => {
        if (yPosition > pageWidth - 20) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(line, margin, yPosition)
        yPosition += 6
      })

      // Add tags if any
      if (ticket.tags.length > 0) {
        yPosition += 5
        if (yPosition > pageWidth - 20) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFont(undefined, 'bold')
        pdf.text('Tags:', margin, yPosition)
        yPosition += 8

        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(9)
        const tagsText = ticket.tags.join(', ')
        const tagsLines = pdf.splitTextToSize(tagsText, pageWidth - margin * 2)
        tagsLines.forEach((line: string) => {
          if (yPosition > pageWidth - 20) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(line, margin, yPosition)
          yPosition += 6
        })
      }

      // Download PDF
      pdf.save(`ticket-${ticket.number}.pdf`)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  if (!user || loading) return null

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-slate-400">Ticket not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <Link href="/tickets" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={18} />
          Back to tickets
        </Link>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6" id="ticket-content">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-slate-400 mb-2">#{ticket.number}</p>
              <h1 className="text-3xl font-semibold text-white">{ticket.title}</h1>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
              >
                <Download size={18} />
                Export PDF
              </button>
              {ticket.status === 'SOLVED' ? (
                <button
                  onClick={handleMarkUnresolved}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors font-medium"
                  title="Mark as unresolved"
                >
                  Unresolved
                </button>
              ) : (
                <button
                  onClick={handleMarkResolved}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-white transition-colors font-medium"
                  title="Mark as resolved"
                >
                  Resolved
                </button>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <Edit2 size={18} />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>

          {isEditing && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={editData.priority || 'MEDIUM'}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value as Priority })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    {priorityOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={editData.status || 'UNTOUCHED'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as Status })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">PRIORITY</p>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">STATUS</p>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColors[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">CATEGORY</p>
              <p className="text-white text-sm font-medium">{ticket.category}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
            <p className="text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.tags.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Tags</h2>
              <div className="flex gap-2 flex-wrap">
                {ticket.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-slate-700 rounded text-sm text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Created</p>
                <p className="text-white">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</p>
              </div>
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="text-white">{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <CommentsSection ticketId={ticketId} />
        </div>

        {/* Attachments Section */}
        <div className="mt-6">
          <AttachmentsSection ticketId={ticketId} />
        </div>
      </main>
    </div>
  )
}
