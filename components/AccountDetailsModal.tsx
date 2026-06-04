'use client'

import { useState, useEffect } from 'react'
import { X, Loader, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { formatDistanceToNow, format } from 'date-fns'

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
        console.error('Error loading user data:', error)
        throw error
      }

      if (data) {
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
      const { error } = await supabase
        .from('tbl_users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          job_title: formData.job_title,
          company: formData.company,
        })
        .eq('id', user.id)

      if (error) throw error

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
          <h2 className="text-xl font-semibold text-white">Account Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <>
              {/* Messages */}
              {message && (
                <div
                  className={`p-3 rounded-lg flex items-gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-900 text-green-200 border border-green-700'
                      : 'bg-red-900 text-red-200 border border-red-700'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check size={18} className="mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* Read-only Fields */}
              <div className="space-y-3 bg-slate-900 p-4 rounded-lg">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Email</label>
                  <p className="text-white font-medium break-all">{user?.email}</p>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Role</label>
                  <p className="text-white font-medium capitalize">
                    {role === 'admin' ? (
                      <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs">
                        Administrator
                      </span>
                    ) : (
                      <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                        User
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">
                    Member Since
                  </label>
                  <p className="text-white font-medium">
                    {joiningDate && formatDistanceToNow(new Date(joiningDate), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {joiningDate && format(new Date(joiningDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Your company name"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="sticky bottom-0 flex gap-2 p-6 border-t border-slate-700 bg-slate-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
