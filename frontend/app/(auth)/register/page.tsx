'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/types'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.push('/dashboard')
    }
  }, [router])

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'alumni' | 'employer',
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.auth.register(form),
    onSuccess: (data) => {
      // TODO: replace localStorage with httpOnly cookies before production
      localStorage.setItem('token', data.data.token)
      router.push('/dashboard')
    },
    onError: (error: ApiError) => {
      setErrorMessage(error.message ?? 'Registration failed. Please try again.')
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a3a5c] flex-col p-12">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-white text-4xl font-semibold leading-snug">
            Connect with opportunities<br />at Memorial University.
          </h2>
          <p className="mt-4 text-blue-200 text-base leading-relaxed max-w-sm">
            MUNext bridges MUN students, alumni, and employers — find jobs, post roles, and build your career.
          </p>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} MUNext. Memorial University of Newfoundland.</p>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">Fill in your details to get started.</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="John Smith"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
              />
            </div>

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
                placeholder="Min. 8 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
              >
                  <option value="student">Student (current MUN student)</option>
                <option value="alumni">Alumni (MUN graduate)</option>
                <option value="employer">Employer (posting jobs)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[#1a3a5c] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <a href="/login" className="text-[#1a3a5c] font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
