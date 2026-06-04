'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Header from '@/components/Header'
import { Plus, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const { isAdmin } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      router.push('/tickets')
      return
    }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('tbl_users').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create user')

      setMessage('User created successfully!')
      setFormData({ email: '', password: '', fullName: '' })
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error creating user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return

    try {
      await supabase.from('tbl_users').delete().eq('id', userId)
      setMessage('User deleted')
      fetchUsers()
    } catch (err) {
      setMessage('Error deleting user')
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-slate-300">Full Name</th>
                <th className="px-4 py-3 text-left text-slate-300">Email</th>
                <th className="px-4 py-3 text-left text-slate-300">Role</th>
                <th className="px-4 py-3 text-left text-slate-300">Created</th>
                <th className="px-4 py-3 text-left text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-white">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
