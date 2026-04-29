'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    retry: false,
  })

  useEffect(() => {
    if (isError) {
      router.push('/login')
      return
    }

    const user = data?.data
    if (!user) return

    if (user.role === 'employer') {
      router.push('/employer')
    } else {
      router.push('/jobs')
    }
  }, [data, isError, router])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    )
  }

  return null
}
