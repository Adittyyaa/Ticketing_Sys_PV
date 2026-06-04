'use client'

import { Ticket, Priority, Status } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface TicketTableProps {
  tickets: Ticket[]
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

export default function TicketTable({ tickets }: TicketTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-700 bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-300">#</th>
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
              <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                No tickets found
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3">
                  <input type="checkbox" className="w-4 h-4" />
                </td>
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
  )
}
