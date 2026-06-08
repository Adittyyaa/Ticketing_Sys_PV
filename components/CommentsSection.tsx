'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Send, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CommentsSectionProps {
  ticketId: string
}

export default function CommentsSection({ ticketId }: CommentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [commenterName, setCommenterName] = useState(user?.email || '')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('tbl_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Fetch comments error:', error)
        throw error
      }

      setComments(data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !commenterName.trim() || !user) {
      alert('Please enter both name and comment')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('tbl_comments')
        .insert([
          {
            ticket_id: ticketId,
            user_id: user.id,
            content: newComment.trim(),
            commenter_name: commenterName.trim(),
            commenter_email: user.email,
          },
        ])
        .select('*')
        .single()

      if (error) {
        console.error('Comment insert error:', error)
        throw error
      }

      setComments(prev => [...prev, data])
      setNewComment('')
    } catch (error) {
      console.error('Failed to post comment:', error)
      alert('Failed to post comment. Check console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return

    try {
      const { error } = await supabase
        .from('tbl_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(comments.filter((c) => c.id !== commentId))
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment')
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-slate-700 rounded"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-medium">
                    {comment.commenter_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {comment.commenter_email && <span className="mr-2">{comment.commenter_email}</span>}
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
                {(user?.id === comment.user_id || isAdmin) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-slate-200 break-words">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            value={commenterName}
            onChange={(e) => setCommenterName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email: {user?.email}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Comment *
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={submitting}
            required
          />
        </div>

        <button
          type="submit"
          disabled={!newComment.trim() || !commenterName.trim() || submitting}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  )
}
