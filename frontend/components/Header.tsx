'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function Header() {
  const router = useRouter()

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    retry: false,
  })

  const user = data?.data

  function handleLogout() {
    api.auth.logout?.()
    localStorage.removeItem('token')
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
                <a href="/profile" className="hover:text-blue-200 transition-colors">My Profile</a>
              )}

              {user.role === 'employer' && (
                <a href="/employer" className="hover:text-blue-200 transition-colors">Dashboard</a>
              )}

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
