'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.auth.forgotPassword(email),
    onSuccess: () => setSubmitted(true),
  })

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a3a5c] flex-col justify-between p-12">
        <span className="text-white text-2xl font-bold tracking-tight">MUNext</span>
        <div>
          <h2 className="text-white text-4xl font-semibold leading-snug">
            Reset your<br />password.
          </h2>
          <p className="mt-4 text-blue-200 text-base leading-relaxed max-w-sm">
            Enter your email and we will send you a link to get back into your account.
          </p>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} MUNext. Memorial University of Newfoundland.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500">
                If an account with that email exists, we sent a password reset link.
              </p>
              <a
                href="/login"
                className="mt-6 inline-block text-sm text-[#1a3a5c] font-medium hover:underline"
              >
                Back to sign in
              </a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your email address and we will send you a reset link.
                </p>
              </div>

              {mutation.isError && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  Something went wrong. Please try again.
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@mun.ca"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-[#1a3a5c] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
                >
                  {mutation.isPending ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-6 text-sm text-gray-500 text-center">
                Remember your password?{' '}
                <a href="/login" className="text-[#1a3a5c] font-medium hover:underline">
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
