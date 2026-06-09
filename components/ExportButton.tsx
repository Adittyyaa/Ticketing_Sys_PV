'use client'

import { useState } from 'react'
import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { Ticket } from '@/types/types'

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ExportButtonProps {
  tickets: Ticket[] // Array of tickets to export
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * TicketsExportButton Component
 * Exports ticket data to CSV format
 * Features:
 * - Converts ticket array to CSV
 * - Handles special characters and quotes
 * - Auto-downloads with timestamped filename
 * - Shows user feedback with messages
 */
export default function TicketsExportButton({ tickets }: ExportButtonProps) {
  // ============================================
  // STATE
  // ============================================
  
  const [isExporting, setIsExporting] = useState(false)

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle CSV export
   * Generates CSV content and triggers download
   */
  const handleExportCSV = () => {
    // Validate: Check if there are tickets to export
    if (tickets.length === 0) {
      message.warning('No tickets to export')
      return
    }

    setIsExporting(true)

    try {
      // ============================================
      // CSV GENERATION
      // ============================================
      
      // Define CSV column headers
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

      // Convert each ticket to CSV row
      const csvRows = tickets.map((ticket) => {
        try {
          return [
            ticket.number || '',
            `"${(ticket.title || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(ticket.description || '').replace(/"/g, '""')}"`, // Escape quotes
            ticket.category || '',
            ticket.priority || '',
            ticket.status || '',
            `"${(ticket.tags || []).join(', ')}"`, // Array to comma-separated string
            new Date(ticket.created_at).toLocaleString(),
            new Date(ticket.updated_at).toLocaleString(),
          ]
        } catch (error) {
          console.error('Error processing ticket:', ticket, error)
          return [] // Skip problematic rows
        }
      })

      // Combine headers and rows into CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.filter(row => row.length > 0).map((row) => row.join(',')),
      ].join('\n')

      // ============================================
      // FILE DOWNLOAD
      // ============================================
      
      // Create Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv` // e.g., tickets-export-2024-01-15.csv
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url) // Clean up
      
      message.success('Tickets exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      message.error('Failed to export tickets')
    } finally {
      setIsExporting(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

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
