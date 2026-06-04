'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useTicketStore } from '@/lib/store'
import Header from '@/components/Header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Category, Priority, Status } from '@/lib/types'

const categories: Category[] = ['Bug Report', 'Technical Issue', 'Account Inquiry', 'New Feature Request', 'Other']
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function NewTicketPage() {
  const router = useRouter()
  const { user, setUser, setLoading } = useAuthStore()
  const { addTicket } = useTicketStore()
  const [loading, setLocalLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Bug Report' as Category,
    priority: 'MEDIUM' as Priority,
    tags: '',
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLocalLoading(true)
    try {
      const { data, error } = await supabase
        .from('tbl_tickets')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            status: 'UNTOUCHED' as Status,
            tags: formData.tags.split(',').map((t) => t.trim()),
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        addTicket(data[0])
        router.push('/tickets')
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
      alert('Failed to create ticket. Please try again.')
    } finally {
      setLocalLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="max-w-2xl mx-auto p-6">
        <Link href="/tickets" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={18} />
          Back to tickets
        </Link>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-white mb-6">Create New Ticket</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Brief title of the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Detailed description of the issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Separate tags with commas (e.g. bug, website, urgent)"
              />
              <p className="text-xs text-slate-400 mt-1">Separate multiple tags with commas</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 px-6 py-2 rounded-lg text-white font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
              <Link
                href="/tickets"
                className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg text-white font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
