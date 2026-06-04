'use client'

import { useState, useEffect } from 'react'
import { X, Loader, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { format } from 'date-fns'

interface AccountDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountDetailsModal({ isOpen, onClose }: AccountDetailsModalProps) {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    job_title: '',
    company: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [joiningDate, setJoiningDate] = useState('')
  const [role, setRole] = useState('')

  // Load user data
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserData()
    }
  }, [isOpen, user?.id])

  const loadUserData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tbl_users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // User record doesn't exist, create it
          console.log('Creating user record...')
          const { data: newUser, error: createError } = await supabase
            .from('tbl_users')
            .insert([{
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              role: 'user',
              created_at: new Date().toISOString(),
            }])
            .select()
            .single()

          if (createError) throw createError

          if (newUser) {
            setFormData({
              full_name: newUser.full_name || '',
              phone: newUser.phone || '',
              job_title: newUser.job_title || '',
              company: newUser.company || '',
            })
            setJoiningDate(newUser.created_at)
            setRole(newUser.role)
          }
        } else {
          throw error
        }
      } else if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          job_title: data.job_title || '',
          company: data.company || '',
        })
        setJoiningDate(data.created_at)
        setRole(data.role)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setMessage({ type: 'error', text: 'Failed to load account details. Please try refreshing the page.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setMessage(null)

    try {
      // Try to update first
      const { error: updateError } = await supabase
        .from('tbl_users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          job_title: formData.job_title,
          company: formData.company,
        })
        .eq('id', user.id)

      if (updateError) {
        // If update fails, try to insert
        const { error: insertError } = await supabase
          .from('tbl_users')
          .insert([{
            id: user.id,
            email: user.email || '',
            full_name: formData.full_name,
            phone: formData.phone,
            job_title: formData.job_title,
            company: formData.company,
            role: 'user',
          }])

        if (insertError) throw insertError
      }

      setMessage({ type: 'success', text: 'Account details updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving account details:', error)
      setMessage({ type: 'error', text: 'Failed to save account details' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-light rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">Account Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <>
              {/* Messages */}
              {message && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check size={18} className="flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              {/* Read-only Fields */}
              <div className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Email</label>
                  <p className="text-white font-medium break-all">{user?.email}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Role</label>
                  <div className="inline-flex">
                    {role === 'admin' ? (
                      <span className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 text-sm font-medium border border-purple-500/20">
                        Administrator
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-300 text-sm font-medium border border-blue-500/20">
                        User
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                    Member Since
                  </label>
                  <p className="text-white font-medium">
                    {joiningDate && format(new Date(joiningDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Your company name"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="flex gap-3 p-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all duration-200 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
