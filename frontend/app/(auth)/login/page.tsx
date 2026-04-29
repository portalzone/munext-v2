'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.auth.login(form),
    onSuccess: (data) => {
      // TODO: replace localStorage with httpOnly cookies before production
      localStorage.setItem('token', data.data.token)
      router.push('/dashboard')
    },
    onError: (error: ApiError) => {
      setErrorMessage(error.message ?? 'Login failed. Please check your credentials.')
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    mutation.mutate()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a3a5c] flex-col justify-between p-12">
        <div>
          <span className="text-white text-2xl font-bold tracking-tight">MUNext</span>
        </div>
        <div>
          <h2 className="text-white text-4xl font-semibold leading-snug">
            Your next opportunity<br />starts here.
          </h2>
          <p className="mt-4 text-blue-200 text-base leading-relaxed max-w-sm">
            Sign in to browse job postings, track your applications, and connect with employers across Newfoundland.
          </p>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} MUNext. Memorial University of Newfoundland.</p>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sign in to MUNext</h1>
            <p className="mt-1 text-sm text-gray-500">Enter your credentials to continue.</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@mun.ca"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Your password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[#1a3a5c] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-[#1a3a5c] font-medium hover:underline">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
