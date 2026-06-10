'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  FileDown,
  CheckCircle2,
  Pencil,
  Trash2,
  Download,
  Paperclip,
} from 'lucide-react'

interface Comment {
  id: number
  author: string
  initials: string
  time: string
  body: string
}

const initialComments: Comment[] = [
  {
    id: 1,
    author: 'Saurav Bhandari',
    initials: 'SB',
    time: '2 hours ago',
    body: 'Thanks for reporting this. I was able to reproduce it on staging and have assigned it to the platform team.',
  },
  {
    id: 2,
    author: 'Aisha Khan',
    initials: 'AK',
    time: '45 minutes ago',
    body: 'Looks like a regression from the last deploy. Working on a fix now, should have a patch shortly.',
  },
]

export function TicketDetailView({ onBack }: { onBack: () => void }) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [draft, setDraft] = useState('')

  function postComment() {
    if (!draft.trim()) return
    setComments((c) => [
      ...c,
      {
        id: c.length + 1,
        author: 'Saurav Bhandari',
        initials: 'SB',
        time: 'Just now',
        body: draft.trim(),
      },
    ])
    setDraft('')
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to admin dashboard
      </button>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            <span className="text-faint">#4</span> Login page returns 500 error
          </h1>
          <p className="mt-1 text-sm text-muted">Opened by Marcus Lee · 2026-03-14</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas">
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas">
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Mark Resolved
          </button>
        </div>
      </div>

      {/* Metadata pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        <MetaPill label="Priority" value="Medium" className="bg-sky-50 text-sky-700 border-sky-200" />
        <MetaPill
          label="Status"
          value="Untouched"
          className="bg-canvas text-muted border-line"
        />
        <MetaPill
          label="Category"
          value="Bug Report"
          className="bg-brand-soft text-brand border-brand/20"
        />
      </div>

      {/* Description */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
        <div className="rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            When attempting to sign in from the production login page, the server responds with a
            500 Internal Server Error roughly 1 in 5 attempts. The issue appears intermittent and
            is more frequent during peak traffic hours.
          </p>
          <p className="mt-3">
            Steps to reproduce: navigate to the login screen, enter valid credentials, and submit.
            The error is logged in the auth service with a database connection timeout. No client
            side changes were made prior to this behavior.
          </p>
        </div>
      </section>

      {/* Comments */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Comments <span className="text-faint">({comments.length})</span>
        </h2>
        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {c.initials}
              </div>
              <div className="flex-1 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{c.author}</span>
                  <span className="text-xs text-faint">{c.time}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full resize-none rounded-lg border border-line bg-canvas p-3 text-sm text-ink placeholder:text-faint outline-none focus:border-brand focus:bg-surface"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={postComment}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              Post Comment
            </button>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Attachments</h2>
        <div className="rounded-xl border border-dashed border-line bg-surface p-5">
          <div className="flex flex-col items-center justify-center gap-1 py-4 text-center">
            <Paperclip className="h-5 w-5 text-faint" />
            <p className="text-sm text-muted">
              Drag & drop files here, or{' '}
              <span className="font-medium text-brand">browse</span>
            </p>
            <p className="text-xs text-faint">PNG, JPG, PDF up to 10MB</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {[
              { name: 'logo.jpeg', size: '2.6 KB' },
              { name: 'error-trace.pdf', size: '128 KB' },
            ].map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <Paperclip className="h-4 w-4 text-faint" />
                  <span className="text-sm font-medium text-ink">{file.name}</span>
                  <span className="text-xs text-faint">{file.size}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink"
                    aria-label={`Download ${file.name}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                  <button
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${file.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetaPill({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
      <span className="text-xs font-medium text-faint">{label}</span>
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
        {value}
      </span>
    </div>
  )
}
