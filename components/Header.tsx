'use client'

import { Bell, Menu, LogOut, LayoutDashboard, User, X } from 'lucide-react'
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
    setShowMenu(false)
    router.push('/auth')
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="w-full px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo - Mobile Responsive */}
          <Link 
            href={isAdmin ? '/admin' : '/tickets'} 
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all duration-200 group min-h-14"
          >
            <div className="relative flex-shrink-0">
              <Image 
                src="/logo.jpeg" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="rounded-lg shadow-lg group-hover:shadow-blue-500/20 transition-shadow sm:w-9 sm:h-9" 
              />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight hidden sm:block">
              Ticket System
            </h1>
          </Link>

          {/* Navigation - Mobile Optimized */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-300 hover:text-white group min-h-12"
                title="Admin Dashboard"
              >
                <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Admin</span>
              </Link>
            )}

            <button 
              className="p-2 sm:p-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-200 relative group min-h-12"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-900"></span>
            </button>

            <button
              onClick={() => setShowAccountModal(true)}
              className="p-2 sm:p-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-200 group min-h-12"
              title="Account Details"
              aria-label="Account"
            >
              <User size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
            </button>

            {/* Menu Button - Mobile First */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-200 group min-h-12"
                aria-label="Menu"
                title="Menu"
              >
                {showMenu ? (
                  <X size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
                ) : (
                  <Menu size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
                )}
              </button>

              {/* Dropdown Menu - Mobile Optimized */}
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30 sm:hidden" 
                    onClick={() => setShowMenu(false)}
                    aria-label="Close menu"
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 glass rounded-lg shadow-2xl z-50 animate-fade-in overflow-hidden border border-slate-700">
                    {/* User Info */}
                    <div className="p-4 border-b border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                        Logged in as
                      </p>
                      <p className="text-white font-medium text-sm break-all leading-relaxed">
                        {user?.email}
                      </p>
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
                    
                    {/* Logout Button - Touch Friendly */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 text-red-400 hover:bg-red-500/10 transition-all duration-200 group font-medium text-sm sm:text-base min-h-12"
                      title="Logout"
                    >
                      <LogOut size={18} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span>Logout</span>
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
