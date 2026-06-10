'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import type { Attachment } from '@/types/types'
import { Paperclip, Download, Trash2, Loader2 } from 'lucide-react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function AttachmentsSection({ ticketId }: { ticketId: string }) {
  const { user, isAdmin } = useAuthStore()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const { data, error } = await supabase
          .from('tbl_attachments')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false })
        if (error) throw error
        setAttachments(data || [])
      } catch (err) {
        console.error('[v0] Failed to fetch attachments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAttachments()
  }, [ticketId])

  const handleUpload = async (file: File) => {
    if (!user) return
    setError(null)
    setUploading(true)
    try {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('File type not allowed. Use images, PDF, or text.')
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File exceeds the 5MB limit.')
      }
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
      const filePath = `${user.id}/${ticketId}/${Date.now()}-${sanitized}`
      const { error: upErr } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file)
      if (upErr) throw upErr

      const { data, error: dbErr } = await supabase
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
      if (dbErr) throw dbErr
      setAttachments((prev) => [data, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (a: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(a.file_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = a.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[v0] Failed to download file:', err)
    }
  }

  const handleDelete = async (a: Attachment) => {
    try {
      await supabase.storage.from('ticket-attachments').remove([a.file_path])
      const { error } = await supabase.from('tbl_attachments').delete().eq('id', a.id)
      if (error) throw error
      setAttachments((prev) => prev.filter((x) => x.id !== a.id))
    } catch (err) {
      console.error('[v0] Failed to delete file:', err)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-ink">
        Attachments <span className="text-faint">({attachments.length})</span>
      </h2>

      <div className="rounded-xl border border-dashed border-line bg-surface p-5">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-1 py-4 text-center disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          ) : (
            <Paperclip className="h-5 w-5 text-faint" />
          )}
          <p className="text-sm text-muted">
            {uploading ? 'Uploading...' : 'Click to '}
            {!uploading && <span className="font-medium text-brand">browse files</span>}
          </p>
          <p className="text-xs text-faint">PNG, JPG, PDF, TXT up to 5MB</p>
        </button>

        {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          attachments.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Paperclip className="h-4 w-4 shrink-0 text-faint" />
                    <span className="truncate text-sm font-medium text-ink">{a.file_name}</span>
                    <span className="shrink-0 text-xs text-faint">{formatSize(a.file_size)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleDownload(a)}
                      className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    {(user?.id === a.user_id || isAdmin) && (
                      <button
                        onClick={() => handleDelete(a)}
                        className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  )
}
