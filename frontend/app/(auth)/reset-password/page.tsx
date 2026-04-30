'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/types'

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''
  const email        = searchParams.get('email') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.auth.resetPassword({
      token,
      email,
      password,
      password_confirmation: confirm,
    }),
    onSuccess: () => setSuccess(true),
    onError: (err: ApiError) => setError(err.error ?? 'Reset failed. The link may have expired.'),
  })

  if (!token || !email) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium">Invalid reset link.</p>
        <a href="/forgot-password" className="mt-4 inline-block text-sm text-[#1a3a5c] hover:underline">
          Request a new one
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h1>
        <p className="text-sm text-gray-500">Your password has been reset successfully.</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 bg-[#1a3a5c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resetting password for <span className="font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate() }}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repeat your new password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
          />
          {confirm && password !== confirm && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || password !== confirm || password.length < 8}
          className="w-full bg-[#1a3a5c] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a3a5c] flex-col justify-between p-12">
        <span className="text-white text-2xl font-bold tracking-tight">MUNext</span>
        <div>
          <h2 className="text-white text-4xl font-semibold leading-snug">
            Almost there.<br />Set your new password.
          </h2>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} MUNext. Memorial University of Newfoundland.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
