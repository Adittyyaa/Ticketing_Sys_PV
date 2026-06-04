'use client'

import { Ticket, Priority, Status } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

interface TicketTableProps {
  tickets: Ticket[]
  onTicketsDeleted?: () => void
}

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

const categoryColors: Record<string, string> = {
  'Bug Report': 'bg-red-900/20 text-red-300',
  'Technical Issue': 'bg-purple-900/20 text-purple-300',
  'Account Inquiry': 'bg-indigo-900/20 text-indigo-300',
  'New Feature Request': 'bg-cyan-900/20 text-cyan-300',
  'Other': 'bg-gray-900/20 text-gray-300',
}

export default function TicketTable({ tickets, onTicketsDeleted }: TicketTableProps) {
  const { isAdmin } = useAuthStore()
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTickets(new Set(tickets.map(t => t.id)))
    } else {
      setSelectedTickets(new Set())
    }
  }

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId)
    } else {
      newSelected.add(ticketId)
    }
    setSelectedTickets(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0) return

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedTickets.size} ticket(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return

    setIsDeleting(true)
    setDeleteMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const response = await fetch('/api/admin/bulk-delete-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTickets)
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete tickets')
      }

      setDeleteMessage({ 
        type: 'success', 
        text: `Successfully deleted ${selectedTickets.size} ticket(s)` 
      })
      setSelectedTickets(new Set())
      
      // Notify parent to refresh tickets
      if (onTicketsDeleted) {
        onTicketsDeleted()
      }

      setTimeout(() => setDeleteMessage(null), 5000)
    } catch (error) {
      setDeleteMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete tickets' 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const allSelected = tickets.length > 0 && selectedTickets.size === tickets.length

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {isAdmin && selectedTickets.size > 0 && (
        <div className="glass-light rounded-xl p-4 border border-white/5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">
              {selectedTickets.size} ticket(s) selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Delete Message */}
      {deleteMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
          deleteMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-300 border border-red-500/20'
        }`}>
          <AlertCircle size={18} />
          <span className="font-medium">{deleteMessage.text}</span>
        </div>
      )}

      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-700 bg-slate-900">
          <tr>
            {isAdmin && (
              <th className="px-4 py-3 text-left font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left font-medium text-slate-300">ID</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">TITLE</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">CATEGORY</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">PRIORITY</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">STATUS</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">CREATED AT</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">UPDATED AT</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">TAGS</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-slate-400">
                No tickets found
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                {isAdmin && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTickets.has(ticket.id)}
                      onChange={() => handleSelectTicket(ticket.id)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="text-blue-400 hover:text-blue-300 font-semibold">
                    #{ticket.number}
                  </Link>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <Link href={`/tickets/${ticket.id}`} className="hover:text-blue-400 truncate">
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[ticket.category] || categoryColors['Other']}`}>
                    {ticket.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {ticket.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        {tag}
                      </span>
                    ))}
                    {ticket.tags.length > 2 && (
                      <span className="text-slate-400 text-xs">+{ticket.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-xs text-slate-400 truncate text-xs">
                  {ticket.description}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}
