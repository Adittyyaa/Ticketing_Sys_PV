'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Attachment } from '@/lib/types'
import { useAuthStore } from '@/lib/store'
import { Upload, File, Image as ImageIcon, Trash2, Download } from 'lucide-react'

interface AttachmentsSectionProps {
  ticketId: string
}

export default function AttachmentsSection({ ticketId }: AttachmentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('tbl_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttachments(data || [])
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is 10MB.`)
          continue
        }

        // Upload to storage
        const filePath = `${user.id}/${ticketId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Save metadata to database
        const { data, error: dbError } = await supabase
          .from('tbl_attachments')
          .insert([
            {
              ticket_id: ticketId,
              user_id: user.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
            },
          ])
          .select()
          .single()

        if (dbError) throw dbError

        setAttachments(prev => [data, ...prev])
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete ${attachment.file_name}?`)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([attachment.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('tbl_attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) throw dbError

      setAttachments(attachments.filter((a) => a.id !== attachment.id))
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      alert('Failed to delete attachment')
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
      alert('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isImage = (type: string) => type.startsWith('image/')

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
        <div className="animate-pulse h-32 bg-slate-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Attachments ({attachments.length})
        </h3>
        <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2">
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
          <Upload size={48} className="mx-auto text-slate-500 mb-3" />
          <p className="text-slate-400 text-sm">No attachments yet</p>
          <p className="text-slate-500 text-xs mt-1">Max file size: 10MB</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex items-start gap-3"
            >
              <div className="flex-shrink-0">
                {isImage(attachment.file_type) ? (
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <ImageIcon size={20} className="text-green-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <File size={20} className="text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {attachment.file_name}
                </p>
                <p className="text-slate-400 text-xs">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(attachment)}
                  className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                {(user?.id === attachment.user_id || isAdmin) && (
                  <button
                    onClick={() => handleDelete(attachment)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
