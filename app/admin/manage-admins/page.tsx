'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Header from '@/components/Header'
import { ShieldPlus, Trash2, Crown, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function ManageAdminsPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuthStore()
  const [admins, setAdmins] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      router.push('/tickets')
      return
    }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('tbl_users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) {
        setAdmins(data.filter(u => u.role === 'admin'))
        setAllUsers(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      // Get current user's session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create admin')

      setMessage({ type: 'success', text: 'Admin account created successfully!' })
      setFormData({ email: '', password: '', fullName: '' })
      setShowForm(false)
      fetchUsers()
      
      setTimeout(() => setMessage(null), 5000)
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Error creating admin account' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      setMessage({ type: 'error', text: 'You cannot delete your own admin account' })
      return
    }

    if (!confirm(`Are you sure you want to remove admin access from ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      // Update user role to 'user'
      const { error } = await supabase
        .from('tbl_users')
        .update({ role: 'user' })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Admin privileges revoked successfully' })
      fetchUsers()
      setTimeout(() => setMessage(null), 5000)
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Error revoking admin privileges' 
      })
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      {/* Admin Banner */}
      <div className="glass-light border-b border-purple-500/20 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Crown className="text-purple-400" size={20} />
          <p className="text-purple-300 text-sm font-medium">ADMIN MANAGEMENT - Manage Administrator Accounts</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Management</h1>
            <p className="text-slate-400">Create and manage administrator accounts with full system access</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin" 
              className="px-4 py-2 glass-light rounded-xl text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              ← Back to Dashboard
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            >
              <ShieldPlus size={18} />
              Create Admin Account
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-300 border border-red-500/20'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Create Admin Form */}
        {showForm && (
          <div className="glass-light rounded-2xl p-6 mb-6 border border-white/5 animate-fade-in">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldPlus size={20} className="text-purple-400" />
              Create New Admin Account
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="admin@pvadvisory.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                >
                  {submitting ? 'Creating Admin...' : 'Create Admin Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 glass-light rounded-xl text-slate-300 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-light rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Crown className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{admins.length}</p>
                <p className="text-sm text-slate-400">Total Admins</p>
              </div>
            </div>
          </div>
          
          <div className="glass-light rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <UserIcon className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{allUsers.length - admins.length}</p>
                <p className="text-sm text-slate-400">Regular Users</p>
              </div>
            </div>
          </div>

          <div className="glass-light rounded-2xl p-6 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <UserIcon className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{allUsers.length}</p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="glass-light rounded-2xl overflow-hidden border border-white/5">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Crown size={20} className="text-purple-400" />
              Current Administrators
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Crown className="text-purple-400" size={16} />
                        </div>
                        <span className="text-white font-medium">{admin.full_name}</span>
                        {admin.id === user?.id && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs rounded-full border border-blue-500/20">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-medium border border-purple-500/20">
                        Administrator
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(admin.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {admin.id !== user?.id ? (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          title="Revoke Admin Access"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-sm">Current User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 glass-light rounded-2xl border border-blue-500/20">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-400 flex-shrink-0" size={20} />
            <div className="text-sm text-slate-300">
              <p className="font-medium text-white mb-1">Admin Account Guidelines</p>
              <ul className="space-y-1 text-slate-400">
                <li>• Admins have full access to all tickets and user management</li>
                <li>• Admin accounts should use strong passwords and enable 2FA when available</li>
                <li>• You cannot delete your own admin account for security reasons</li>
                <li>• Revoking admin access converts the account to a regular user</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
