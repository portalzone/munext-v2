'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function Header() {
  const router        = useRouter()
  const queryClient   = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    retry: false,
  })

  const user = data?.data

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    enabled: !!user,
    refetchInterval: 30000,
  })

  const { data: msgData } = useQuery({
    queryKey: ['message-unread'],
    queryFn: () => api.messages.unreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  })

  const unreadCount    = notifData?.unread_count ?? 0
  const unreadMessages = msgData?.data?.unread_count ?? 0

  const isJobSeeker = user?.role === 'student' || user?.role === 'alumni'

  async function handleLogout() {
    try { await api.auth.logout() } catch { /* ignore */ }
    localStorage.removeItem('token')
    // setQueryData triggers an immediate synchronous re-render with no user
    // before clear() wipes the rest of the cache
    queryClient.setQueryData(['me'], undefined)
    queryClient.clear()
    setMenuOpen(false)
    router.push('/login')
  }

  // Nav links vary by role — defined once, used for both desktop + mobile
  const navLinks = user ? (
    <>
      <Link href="/jobs" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
        Jobs
      </Link>

      {isJobSeeker && (
        <>
          <Link href="/profile" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
            My Profile
          </Link>
          <Link href="/jobs/applications" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
            My Applications
          </Link>
          <Link href="/jobs/bookmarks" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
            Saved Jobs
          </Link>
        </>
      )}

      {isJobSeeker && unreadMessages > 0 && (
        <Link
          href="/jobs/applications"
          onClick={() => setMenuOpen(false)}
          className="relative hover:text-blue-200 transition-colors text-sm flex items-center gap-1"
          title={`${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        </Link>
      )}

      {user.role === 'employer' && (
        <>
          <Link href="/employer" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
            Dashboard
          </Link>
          <Link
            href="/employer/messages"
            onClick={() => setMenuOpen(false)}
            className="relative hover:text-blue-200 transition-colors flex items-center gap-1.5"
          >
            Messages
            {unreadMessages > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>
          <Link href="/employer/profile" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
            Company Profile
          </Link>
        </>
      )}

      <Link href="/analytics" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
        Analytics
      </Link>

      {user.role === 'admin' && (
        <Link href="/admin" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
          Admin
        </Link>
      )}
    </>
  ) : null

  return (
    <div className="bg-[#1a3a5c] text-white">
      {/* Main bar */}
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">MUNext</Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {user ? (
            <>
              {navLinks}

              {/* Bell icon */}
              <Link href="/notifications" className="relative p-1.5 hover:text-blue-200 transition-colors" title="Notifications">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-3 border-l border-blue-400 pl-6">
                <span className="text-blue-200 text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-[#1a3a5c] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-200 transition-colors">Sign in</Link>
              <Link
                href="/register"
                className="bg-white text-[#1a3a5c] px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: bell + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {user && (
            <Link href="/notifications" className="relative p-1.5 hover:text-blue-200 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-[#15304d] transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-blue-400/50 px-6 py-5 text-sm">
          {user ? (
            <div className="flex flex-col gap-5">
              {navLinks}
              <div className="border-t border-blue-400/50 pt-4 flex items-center justify-between">
                <span className="text-blue-200 font-medium">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-[#1a3a5c] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="hover:text-blue-200 transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="inline-block bg-white text-[#1a3a5c] px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-fit"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
