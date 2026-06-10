import type { Ticket } from '@/types/types'

/**
 * Convert tickets to CSV and trigger a browser download.
 * Pure DOM/Blob implementation — no UI framework dependency.
 */
export function exportTicketsCsv(tickets: Ticket[]) {
  if (!tickets || tickets.length === 0) return

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

  const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`

  const rows = tickets.map((t) =>
    [
      t.number ?? '',
      escape(t.title),
      escape(t.description),
      t.category ?? '',
      t.priority ?? '',
      t.status ?? '',
      escape((t.tags || []).join(', ')),
      t.created_at ? new Date(t.created_at).toLocaleString() : '',
      t.updated_at ? new Date(t.updated_at).toLocaleString() : '',
    ].join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
