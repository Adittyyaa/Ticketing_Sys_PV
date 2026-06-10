'use client'

import { useState } from 'react'
import { Mail, Lock, ArrowRightLeft } from 'lucide-react'

export function LoginView({ onSignIn }: { onSignIn: () => void }) {
  const [mode, setMode] = useState<'user' | 'admin'>('user')

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            T
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">Ticketing App</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {mode === 'admin' ? 'Admin Login' : 'User Login'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sign in to access your {mode === 'admin' ? 'admin console' : 'support dashboard'}.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSignIn()
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  id="email"
                  type="email"
                  defaultValue="saurav@pvadvisory.com"
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-faint outline-none focus:border-brand focus:bg-surface"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  id="password"
                  type="password"
                  defaultValue="password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-faint outline-none focus:border-brand focus:bg-surface"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90"
            >
              Sign In
            </button>
          </form>

          <button
            onClick={() => setMode((m) => (m === 'user' ? 'admin' : 'user'))}
            className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Switch to {mode === 'user' ? 'Admin' : 'User'} login
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          PV Advisory · Enterprise · Secure sign-in
        </p>
      </div>
    </div>
  )
}
