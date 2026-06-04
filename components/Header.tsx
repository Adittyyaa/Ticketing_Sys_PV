'use client'

import { Bell, Menu, LogOut, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const { user, setUser, isAdmin } = useAuthStore()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth')
  }

  return (
    <header className="border-b border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href={isAdmin ? '/admin' : '/tickets'} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <Image src="/logo.jpeg" alt="Logo" width={40} height={40} className="rounded-lg" />
          <h1 className="text-xl font-semibold text-white">Ticket System</h1>
        </Link>

        <div className="flex items-center gap-6">
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
              <LayoutDashboard size={18} />
              <span className="text-sm">Admin</span>
            </Link>
          )}

          <button className="text-slate-400 hover:text-white transition-colors">
            <Bell size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-slate-700">
                  <p className="text-sm text-slate-400">Logged in as</p>
                  <p className="text-white font-medium text-sm break-all">{user?.email}</p>
                  <p className="text-xs text-slate-400 capitalize mt-1">Role: {isAdmin ? 'admin' : 'user'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
