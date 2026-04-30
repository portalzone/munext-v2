'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function Header() {
  const router      = useRouter()
  const queryClient = useQueryClient()

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

  const unreadCount = notifData?.unread_count ?? 0

  function handleLogout() {
    api.auth.logout()
    localStorage.removeItem('token')
    queryClient.clear()
    router.push('/login')
  }

  return (
    <header className="bg-[#1a3a5c] text-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight">MUNext</a>

        <nav className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <a href="/jobs" className="hover:text-blue-200 transition-colors">Jobs</a>

              {user.role === 'student' && (
                <>
                  <a href="/profile" className="hover:text-blue-200 transition-colors">My Profile</a>
                  <a href="/jobs/bookmarks" className="hover:text-blue-200 transition-colors">Saved Jobs</a>
                </>
              )}

              {user.role === 'employer' && (
                <a href="/employer" className="hover:text-blue-200 transition-colors">Dashboard</a>
              )}

              {user.role === 'admin' && (
                <a href="/admin" className="hover:text-blue-200 transition-colors">Admin</a>
              )}

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
                <span className="text-blue-200">{user.name}</span>
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
              <a href="/login" className="hover:text-blue-200 transition-colors">Sign in</a>
              <a
                href="/register"
                className="bg-white text-[#1a3a5c] px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Get started
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
