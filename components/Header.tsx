'use client'

import { Bell, Menu, LogOut, LayoutDashboard, User } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import AccountDetailsModal from './AccountDetailsModal'

export default function Header() {
  const { user, setUser, isAdmin } = useAuthStore()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth')
  }

  return (
    <>
      <header className="sticky top-0 z-40 glass backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-18">
          <Link 
            href={isAdmin ? '/admin' : '/tickets'} 
            className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 group"
          >
            <div className="relative">
              <Image 
                src="/logo.jpeg" 
                alt="Logo" 
                width={36} 
                height={36} 
                className="rounded-xl shadow-lg group-hover:shadow-blue-500/20 transition-shadow" 
              />
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Ticket System</h1>
          </Link>

          <nav className="flex items-center gap-2">
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 text-slate-300 hover:text-white group"
              >
                <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Admin</span>
              </Link>
            )}

            <button 
              className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 relative group"
              aria-label="Notifications"
            >
              <Bell size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-900"></span>
            </button>

            <button
              onClick={() => setShowAccountModal(true)}
              className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 group"
              title="Account Details"
              aria-label="Account"
            >
              <User size={20} className="group-hover:scale-110 transition-transform" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 group"
                aria-label="Menu"
              >
                <Menu size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 glass rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                    <div className="p-5 border-b border-white/5">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Logged in as</p>
                      <p className="text-white font-medium text-sm break-all leading-relaxed">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs font-medium capitalize">
                        {isAdmin ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            <span className="text-purple-300">Administrator</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            <span className="text-blue-300">User</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                    >
                      <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Account Details Modal */}
      <AccountDetailsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </>
  )
}
