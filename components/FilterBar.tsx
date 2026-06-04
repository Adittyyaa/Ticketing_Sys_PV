'use client'

import { Search, Plus } from 'lucide-react'
import { useTicketStore } from '@/lib/store'
import Link from 'next/link'

export default function FilterBar() {
  const { filters, setFilters } = useTicketStore()

  return (
    <div className="bg-slate-900 border-b border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Ticket Management</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/tickets/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            <Plus size={18} />
            Add ticket
          </Link>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for tickets"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <select
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          defaultValue="all"
        >
          <option value="all">All</option>
        </select>

        <select
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          defaultValue="all"
        >
          <option value="all">All</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">Urgent Priority</option>
        </select>

        <input
          type="date"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />

        <input
          type="date"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors">
          Search
        </button>
      </div>
    </div>
  )
}
