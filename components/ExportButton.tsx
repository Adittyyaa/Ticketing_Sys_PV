'use client'

import { useState } from 'react'
import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { Ticket } from '@/types/types'

interface ExportButtonProps {
  tickets: Ticket[]
}

export default function TicketsExportButton({ tickets }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = () => {
    if (tickets.length === 0) { message.warning('No tickets to export'); return }
    setIsExporting(true)
    try {
      const csvHeaders = ['Ticket Number', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Tags', 'Created At', 'Updated At']
      const csvRows = tickets.map((ticket) => [
        ticket.number || '',
        `"${(ticket.title || '').replace(/"/g, '""')}"`,
        `"${(ticket.description || '').replace(/"/g, '""')}"`,
        ticket.category || '',
        ticket.priority || '',
        ticket.status || '',
        `"${(ticket.tags || []).join(', ')}"`,
        new Date(ticket.created_at).toLocaleString(),
        new Date(ticket.updated_at).toLocaleString(),
      ])
      const csvContent = [csvHeaders.join(','), ...csvRows.filter(row => row.length > 0).map((row) => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success('Tickets exported')
    } catch { message.error('Failed to export') }
    finally { setIsExporting(false) }
  }

  return (
    <Button onClick={handleExportCSV} disabled={isExporting || tickets.length === 0} loading={isExporting} icon={<DownloadOutlined />} style={{ height: 32, fontSize: 13, borderRadius: 6 }}>
      Export CSV
    </Button>
  )
}
