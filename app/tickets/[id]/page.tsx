'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import NavigationHeader from '@/components/Header'
import { 
  Layout, 
  Button, 
  Form,
  Select,
  message,
  Modal,
  Spin,
  Typography
} from 'antd'
import { 
  ArrowLeft,
  Download,
  Edit2,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { Ticket, Status, Priority } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import jsPDF from 'jspdf'

import TicketComments from '@/components/CommentsSection'
import AttachmentsSection from '@/components/AttachmentsSection'

const { Text } = Typography
const { Content } = Layout

const statusOptions: Status[] = ['UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED']
const priorityOptions: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

const statusColors: Record<Status, string> = {
  UNTOUCHED: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  PENDING: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  OPENED: 'bg-green-500/10 text-green-400 border border-green-500/20',
  SOLVED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const [form] = Form.useForm()
  const ticketId = params.id as string
  
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLocalLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

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

  // Helper function to check if user is admin
  const checkIsAdmin = async () => {
    if (!user) return false
    const { data } = await supabase
      .from('tbl_users')
      .select('role')
      .eq('id', user.id)
      .single()
    return data?.role === 'admin'
  }

  // Helper function to build query with admin check
  const buildTicketQuery = async (baseQuery: any) => {
    const isAdmin = await checkIsAdmin()
    return isAdmin ? baseQuery : baseQuery.eq('user_id', user?.id)
  }

  useEffect(() => {
    if (!user) return

    const fetchTicket = async () => {
      try {
        let query = supabase
          .from('tbl_tickets')
          .select('*')
          .eq('id', ticketId)

        query = await buildTicketQuery(query)
        const { data, error } = await query.single()

        if (error) throw error

        setTicket(data as Ticket)
        form.setFieldsValue({
          priority: data.priority,
          status: data.status
        })
      } catch (error) {
        console.error('Failed to fetch ticket:', error)
        message.error('Failed to load ticket')
        router.push('/tickets')
      } finally {
        setLocalLoading(false)
      }
    }

    fetchTicket()
  }, [user, ticketId, router, form])

  const handleSave = async (values: { priority: Priority; status: Status }) => {
    if (!ticket) return

    try {
      let query = supabase
        .from('tbl_tickets')
        .update({
          priority: values.priority,
          status: values.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)

      query = await buildTicketQuery(query)
      const { error } = await query

      if (error) throw error

      setTicket({ 
        ...ticket, 
        priority: values.priority,
        status: values.status 
      })
      setIsEditing(false)
      message.success('Ticket updated successfully')
    } catch (error) {
      console.error('Failed to update ticket:', error)
      message.error('Failed to update ticket')
    }
  }

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Ticket',
      content: 'Are you sure you want to delete this ticket? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          let query = supabase
            .from('tbl_tickets')
            .delete()
            .eq('id', ticket?.id)

          query = await buildTicketQuery(query)
          const { error } = await query

          if (error) throw error

          message.success('Ticket deleted successfully')
          router.push('/tickets')
        } catch (error) {
          console.error('Failed to delete ticket:', error)
          message.error('Failed to delete ticket')
        }
      }
    })
  }

  const updateTicketStatus = async (newStatus: Status, successMessage: string) => {
    if (!ticket) return

    try {
      let query = supabase
        .from('tbl_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)

      query = await buildTicketQuery(query)
      const { error } = await query

      if (error) throw error

      setTicket({ ...ticket, status: newStatus })
      form.setFieldsValue({ status: newStatus })
      message.success(successMessage)
    } catch (error) {
      console.error('Failed to update status:', error)
      message.error('Failed to update ticket status')
    }
  }

  const handleMarkResolved = () => updateTicketStatus('SOLVED', 'Ticket marked as resolved')
  const handleMarkUnresolved = () => updateTicketStatus('OPENED', 'Ticket marked as unresolved')

  // PDF Export Constants
  const PDF_CONFIG = {
    MARGIN: 15,
    LOGO_SIZE: 25,
    FONT_SIZE: {
      TITLE: 16,
      SUBTITLE: 12,
      BODY: 10,
      SMALL: 9,
      SECTION: 11
    },
    LINE_HEIGHT: {
      SMALL: 6,
      NORMAL: 7,
      LARGE: 8
    }
  }

  // Helper: Add logo to PDF
  const addLogoToPDF = (pdf: jsPDF, yPosition: number): number => {
    try {
      const logoImg = document.querySelector('img[src="/logo.jpeg"]') as HTMLImageElement
      if (logoImg) {
        pdf.addImage(logoImg.src, 'JPEG', PDF_CONFIG.MARGIN, yPosition, PDF_CONFIG.LOGO_SIZE, PDF_CONFIG.LOGO_SIZE)
        return yPosition + 30
      }
    } catch (e) {
      console.log('Logo not added')
    }
    return yPosition
  }

  // Helper: Add ticket header to PDF
  const addTicketHeader = (pdf: jsPDF, ticket: Ticket, yPosition: number): number => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(PDF_CONFIG.FONT_SIZE.TITLE)
    pdf.text(`Ticket #${ticket.number}`, PDF_CONFIG.MARGIN, yPosition)
    yPosition += 10

    pdf.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${ticket.title}`, PDF_CONFIG.MARGIN, yPosition)
    yPosition += 15

    pdf.setFontSize(PDF_CONFIG.FONT_SIZE.BODY)
    pdf.setTextColor(120, 130, 140)
    pdf.text(`Generated on: ${format(new Date(), 'PPP p')}`, PDF_CONFIG.MARGIN, yPosition)
    yPosition += 8

    return yPosition
  }

  // Helper: Add ticket details section to PDF
  const addTicketDetails = (pdf: jsPDF, ticket: Ticket, yPosition: number): number => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(PDF_CONFIG.FONT_SIZE.SECTION)
    pdf.setFont('helvetica', 'bold')
    yPosition += 5
    pdf.text('Ticket Details:', PDF_CONFIG.MARGIN, yPosition)
    yPosition += 8

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.FONT_SIZE.BODY)

    const details = [
      `Status: ${ticket.status}`,
      `Priority: ${ticket.priority}`,
      `Category: ${ticket.category}`,
      `Created: ${format(new Date(ticket.created_at), 'PPP p')}`,
      `Last Updated: ${format(new Date(ticket.updated_at), 'PPP p')}`,
    ]

    details.forEach((text) => {
      if (yPosition > pageWidth - 20) {
        pdf.addPage()
        yPosition = PDF_CONFIG.MARGIN
      }
      pdf.text(text, PDF_CONFIG.MARGIN + 5, yPosition)
      yPosition += PDF_CONFIG.LINE_HEIGHT.NORMAL
    })

    return yPosition
  }

  // Helper: Add description section to PDF
  const addDescription = (pdf: jsPDF, ticket: Ticket, yPosition: number): number => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    yPosition += 5
    pdf.setFont('helvetica', 'bold')
    pdf.text('Description:', PDF_CONFIG.MARGIN, yPosition)
    yPosition += 8

    pdf.setFont('helvetica', 'normal')
    const descriptionLines = pdf.splitTextToSize(ticket.description, pageWidth - PDF_CONFIG.MARGIN * 2)
    descriptionLines.forEach((line: string) => {
      if (yPosition > pageWidth - 20) {
        pdf.addPage()
        yPosition = PDF_CONFIG.MARGIN
      }
      pdf.text(line, PDF_CONFIG.MARGIN, yPosition)
      yPosition += PDF_CONFIG.LINE_HEIGHT.SMALL
    })

    return yPosition
  }

  // Helper: Add tags section to PDF
  const addTags = (pdf: jsPDF, ticket: Ticket, yPosition: number): number => {
    if (ticket.tags.length === 0) return yPosition
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    yPosition += 5
    if (yPosition > pageWidth - 20) {
      pdf.addPage()
      yPosition = PDF_CONFIG.MARGIN
    }

    pdf.setFont('helvetica', 'bold')
    pdf.text('Tags:', PDF_CONFIG.MARGIN, yPosition)
    yPosition += 8

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
    const tagsText = ticket.tags.join(', ')
    const tagsLines = pdf.splitTextToSize(tagsText, pageWidth - PDF_CONFIG.MARGIN * 2)
    tagsLines.forEach((line: string) => {
      if (yPosition > pageWidth - 20) {
        pdf.addPage()
        yPosition = PDF_CONFIG.MARGIN
      }
      pdf.text(line, PDF_CONFIG.MARGIN, yPosition)
      yPosition += PDF_CONFIG.LINE_HEIGHT.SMALL
    })

    return yPosition
  }

  const handleExportPDF = async () => {
    if (!ticket) return

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      let yPosition = PDF_CONFIG.MARGIN

      // Build PDF sections
      yPosition = addLogoToPDF(pdf, yPosition)
      yPosition = addTicketHeader(pdf, ticket, yPosition)
      yPosition = addTicketDetails(pdf, ticket, yPosition)
      yPosition = addDescription(pdf, ticket, yPosition)
      yPosition = addTags(pdf, ticket, yPosition)

      pdf.save(`ticket-${ticket.number}.pdf`)
      message.success('PDF exported successfully')
    } catch (error) {
      console.error('Failed to export PDF:', error)
      message.error('Failed to export PDF. Please try again.')
    }
  }

  if (!user || loading) {
    return (
      <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
        <NavigationHeader />
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)' 
        }}>
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  if (!ticket) {
    return (
      <Layout style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
        <NavigationHeader />
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)' 
        }}>
          <Text style={{ color: '#94a3b8' }}>Ticket not found</Text>
        </Content>
      </Layout>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavigationHeader />
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
              <Button
                onClick={handleExportPDF}
                type="text"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                style={{ color: 'white', border: 'none' }}
              >
                <Download size={18} />
                Export PDF
              </Button>
              {ticket.status === 'SOLVED' ? (
                <Button
                  onClick={handleMarkUnresolved}
                  type="text"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors font-medium"
                  style={{ color: 'white', border: 'none' }}
                  title="Mark as unresolved"
                >
                  Unresolved
                </Button>
              ) : (
                <Button
                  onClick={handleMarkResolved}
                  type="text"
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-white transition-colors font-medium"
                  style={{ color: 'white', border: 'none' }}
                  title="Mark as resolved"
                >
                  Resolved
                </Button>
              )}
              <Button
                onClick={() => setIsEditing(!isEditing)}
                type="text"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                style={{ color: 'white', border: 'none' }}
              >
                <Edit2 size={18} />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                onClick={handleDelete}
                type="text"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                style={{ color: 'white', border: 'none' }}
              >
                <Trash2 size={18} />
                Delete
              </Button>
            </div>
          </div>

          {isEditing && (
            <div className="mb-6 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  priority: ticket.priority,
                  status: ticket.status
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Form.Item
                    label={<span style={{ color: '#d1d5db' }}>Priority</span>}
                    name="priority"
                    rules={[{ required: true }]}
                  >
                    <Select size="large" dropdownStyle={{ backgroundColor: '#1f2937' }}>
                      {priorityOptions.map((p) => (
                        <Select.Option key={p} value={p}>
                          {p}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label={<span style={{ color: '#d1d5db' }}>Status</span>}
                    name="status"
                    rules={[{ required: true }]}
                  >
                    <Select size="large" dropdownStyle={{ backgroundColor: '#1f2937' }}>
                      {statusOptions.map((s) => (
                        <Select.Option key={s} value={s}>
                          {s}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
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
          <TicketComments ticketId={ticketId} />
        </div>

        {/* Attachments Section */}
        <div className="mt-6">
          <AttachmentsSection ticketId={ticketId} />
        </div>
      </main>
    </div>
  )
}
