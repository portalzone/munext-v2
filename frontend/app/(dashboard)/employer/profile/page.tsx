'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { EmployerProfile } from '@/lib/types'

type ProfileFormData = {
  company_name: string
  industry: string
  website: string
  location: string
  description: string
}

const EMPTY_FORM: ProfileFormData = {
  company_name: '',
  industry: '',
  website: '',
  location: '',
  description: '',
}

export default function EmployerProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['employer-profile'],
    queryFn: () => api.employer.getProfile(),
  })

  const profile = data?.data ?? null

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name ?? '',
        industry: profile.industry ?? '',
        website: profile.website ?? '',
        location: profile.location ?? '',
        description: profile.description ?? '',
      })
    }
  }, [profile])

  const createMutation = useMutation({
    mutationFn: (d: ProfileFormData) =>
      api.employer.createProfile({
        company_name: d.company_name,
        industry: d.industry || null,
        website: d.website || null,
        location: d.location || null,
        description: d.description || null,
      } as Parameters<typeof api.employer.createProfile>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-profile'] })
      setSuccessMsg('Company profile created.')
      setIsEditing(false)
    },
    onError: (err: { error?: string }) => {
      setErrorMsg(err?.error ?? 'Failed to create profile.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (d: ProfileFormData) =>
      api.employer.updateProfile({
        company_name: d.company_name,
        industry: d.industry || null,
        website: d.website || null,
        location: d.location || null,
        description: d.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-profile'] })
      setSuccessMsg('Company profile updated.')
      setIsEditing(false)
    },
    onError: (err: { error?: string }) => {
      setErrorMsg(err?.error ?? 'Failed to update profile.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')
    if (!form.company_name.trim()) {
      setErrorMsg('Company name is required.')
      return
    }
    if (profile) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const showForm = !profile || isEditing

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              This profile is visible to students browsing your job postings.
            </p>
          </div>
          <button
            onClick={() => router.push('/employer')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {profile && !isEditing ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{profile.company_name}</h2>
                {profile.industry && (
                  <span className="inline-block mt-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {profile.industry}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setIsEditing(true); setSuccessMsg(''); setErrorMsg('') }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {profile.location && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-gray-700">{profile.location}</p>
                </div>
              )}
              {profile.website && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Website</p>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>

            {profile.description && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">About</p>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {profile.description}
                </p>
              </div>
            )}

            {!profile.industry && !profile.location && !profile.website && !profile.description && (
              <p className="text-sm text-gray-400 italic">
                Add more details to help students learn about your company.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="e.g. Acme Corporation"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="e.g. Technology"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. St. John's, NL"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yourcompany.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About the Company</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your company, culture, and what makes it a great place to work..."
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Saving...' : profile ? 'Save Changes' : 'Create Profile'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setErrorMsg('')
                    if (profile) {
                      setForm({
                        company_name: profile.company_name ?? '',
                        industry: profile.industry ?? '',
                        website: profile.website ?? '',
                        location: profile.location ?? '',
                        description: profile.description ?? '',
                      })
                    }
                  }}
                  className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
