'use client'

import { useState } from 'react'
import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { Ticket } from '@/lib/types'

interface ExportButtonProps {
  tickets: Ticket[]
}

export default function TicketsExportButton({ tickets }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = () => {
    if (tickets.length === 0) {
      message.warning('No tickets to export')
      return
    }

    setIsExporting(true)

    try {
      const csvHeaders = [
        'Ticket Number',
        'Title',
        'Description',
        'Category',
        'Priority',
        'Status',
        'Tags',
        'Created At',
        'Updated At',
      ]

      const csvRows = tickets.map((ticket) => {
        try {
          return [
            ticket.number || '',
            `"${(ticket.title || '').replace(/"/g, '""')}"`,
            `"${(ticket.description || '').replace(/"/g, '""')}"`,
            ticket.category || '',
            ticket.priority || '',
            ticket.status || '',
            `"${(ticket.tags || []).join(', ')}"`,
            new Date(ticket.created_at).toLocaleString(),
            new Date(ticket.updated_at).toLocaleString(),
          ]
        } catch (error) {
          console.error('Error processing ticket:', ticket, error)
          return []
        }
      })

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.filter(row => row.length > 0).map((row) => row.join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success('Tickets exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      message.error('Failed to export tickets')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExportCSV}
      disabled={isExporting || tickets.length === 0}
      loading={isExporting}
      icon={<DownloadOutlined />}
      type="primary"
    >
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  )
}
