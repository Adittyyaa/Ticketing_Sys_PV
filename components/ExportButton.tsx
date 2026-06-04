'use client'

import { useState } from 'react'
import { Ticket } from '@/lib/types'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  tickets: Ticket[]
}

export default function ExportButton({ tickets }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    if (tickets.length === 0) {
      alert('No tickets to export')
      return
    }

    setExporting(true)

    try {
      // CSV headers
      const headers = [
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

      // CSV rows - with better error handling
      const rows = tickets.map((ticket) => {
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
        } catch (e) {
          console.error('Error processing ticket:', ticket, e)
          return []
        }
      })

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.filter(row => row.length > 0).map((row) => row.join(',')),
      ].join('\n')

      console.log('CSV Content:', csvContent.substring(0, 100))

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`
      
      console.log('Downloading file:', link.download)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('Export successful!')
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Failed to export tickets: ${error}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={exportToCSV}
      disabled={exporting || tickets.length === 0}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
      title="Export to CSV"
    >
      <Download size={18} />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
