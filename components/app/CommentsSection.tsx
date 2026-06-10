'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Loader2 } from 'lucide-react'

interface CommentData {
  id: string
  ticket_id: string
  user_id: string
  content: string
  commenter_name?: string
  commenter_email?: string
  created_at: string
  updated_at: string
}

export function CommentsSection({ ticketId }: { ticketId: string }) {
  const { user, isAdmin } = useAuthStore()
  const [comments, setComments] = useState<CommentData[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('tbl_comments')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
        if (error) throw error
        setComments(data || [])
      } catch (err) {
        console.error('[v0] Failed to fetch comments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [ticketId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !draft.trim()) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('tbl_comments')
        .insert([
          {
            ticket_id: ticketId,
            user_id: user.id,
            content: draft.trim(),
            commenter_name: user.email,
            commenter_email: user.email,
          },
        ])
        .select('*')
        .single()
      if (error) throw error
      setComments((prev) => [...prev, data])
      setDraft('')
    } catch (err) {
      console.error('[v0] Failed to post comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tbl_comments').delete().eq('id', id)
      if (error) throw error
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('[v0] Failed to delete comment:', err)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-ink">
        Comments <span className="text-faint">({comments.length})</span>
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 px-1 py-4 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          No comments yet. Be the first to add one.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((c) => {
            const name = c.commenter_name || c.commenter_email || 'Anonymous'
            const initials = name.slice(0, 2).toUpperCase()
            return (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="flex-1 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{name}</span>
                    <span className="text-xs text-faint">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                    {c.content}
                  </p>
                  {(user?.id === c.user_id || isAdmin) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-line bg-surface p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full resize-none rounded-lg border border-line bg-canvas p-3 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:bg-surface"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Post Comment
          </button>
        </div>
      </form>
    </section>
  )
}
