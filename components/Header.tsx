'use client'

import { Bell, Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/login')
  }

  return (
    <header className="border-b border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl">🎫</div>
          <h1 className="text-xl font-semibold text-white">Ticket System</h1>
        </div>

        <div className="flex items-center gap-6">
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
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-slate-700">
                  <p className="text-sm text-slate-400">Logged in as</p>
                  <p className="text-white font-medium">{user?.email}</p>
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
