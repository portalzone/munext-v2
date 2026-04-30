'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { JobFilters, JobPosting, JobType } from '@/lib/types'

const LEVEL_LABELS: Record<JobPosting['experience_level'], string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
}

const LEVEL_COLORS: Record<JobPosting['experience_level'], string> = {
  entry:  'bg-green-100 text-green-700',
  mid:    'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
}

const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time':  'Full-time',
  'part-time':  'Part-time',
  'contract':   'Contract',
  'internship': 'Internship',
}

const CATEGORIES = [
  'Software Development',
  'Web Development',
  'IT & Systems',
  'Data Science & AI',
  'Cybersecurity',
  'DevOps & Cloud',
  'Engineering',
  'Design & UX',
  'Marketing',
  'Finance & Accounting',
  'Healthcare',
  'Education & Research',
  'Sales & Business',
  'Other',
]

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`
  if (min) return `From $${(min / 1000).toFixed(0)}k`
  return `Up to $${(max! / 1000).toFixed(0)}k`
}

export default function JobsPage() {
  const [filters, setFilters]     = useState<JobFilters>({ page: 1, per_page: 15 })
  const [search, setSearch]       = useState('')
  const [location, setLocation]   = useState('')
  const [pendingFilters, setPendingFilters] = useState<Omit<JobFilters, 'search' | 'location' | 'page' | 'per_page'>>({})
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.list(filters),
  })

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    retry: false,
  })

  const isStudent = meData?.data.role === 'student'

  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.jobs.bookmarks(),
    enabled: isStudent,
  })

  const bookmarkedIds = new Set(bookmarksData?.data.map((j) => j.id) ?? [])

  const bookmarkMutation = useMutation({
    mutationFn: (jobId: number) => api.jobs.toggleBookmark(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })

  function applyFilters(e: React.FormEvent) {
    e.preventDefault()
    setFilters({
      ...pendingFilters,
      search:   search || undefined,
      location: location || undefined,
      page: 1,
      per_page: 15,
    })
  }

  function clearFilters() {
    setSearch('')
    setLocation('')
    setPendingFilters({})
    setFilters({ page: 1, per_page: 15 })
  }

  function setPending(key: keyof typeof pendingFilters, value: string | boolean | undefined) {
    setPendingFilters(f => ({ ...f, [key]: value || undefined }))
  }

  const jobs       = data?.data ?? []
  const pagination = data?.pagination
  const hasFilters = !!(
    filters.search || filters.category || filters.job_type ||
    filters.experience_level || filters.location || filters.is_remote ||
    filters.salary_min || filters.salary_max
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <select
            value={filters.sort ?? 'newest'}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value as JobFilters['sort'], page: 1 }))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="salary_high">Salary: high to low</option>
            <option value="salary_low">Salary: low to high</option>
          </select>
        </div>

        <div className="flex gap-6">

          {/* Filter sidebar */}
          <aside className="hidden md:block w-60 shrink-0">
            <form
              onSubmit={applyFilters}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Filters</h2>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs text-[#1a3a5c] hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Job title or keyword..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <select
                  value={pendingFilters.category ?? ''}
                  onChange={e => setPending('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Job Type</label>
                <select
                  value={pendingFilters.job_type ?? ''}
                  onChange={e => setPending('job_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Experience Level</label>
                <select
                  value={pendingFilters.experience_level ?? ''}
                  onChange={e => setPending('experience_level', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City or province..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pendingFilters.is_remote === true}
                    onChange={e => setPending('is_remote', e.target.checked ? true : undefined)}
                    className="w-3.5 h-3.5 accent-[#1a3a5c]"
                  />
                  <span className="text-xs text-gray-600">Remote only</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
              >
                Apply Filters
              </button>
            </form>
          </aside>

          {/* Job list */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-4">
              {isLoading ? 'Loading...' : pagination
                ? `${pagination.total} ${pagination.total === 1 ? 'job' : 'jobs'} found`
                : ''}
            </p>

            {/* Loading skeletons */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <p className="text-red-600 font-medium">Failed to load jobs.</p>
                <p className="text-gray-500 text-sm mt-1">Make sure you are logged in.</p>
              </div>
            )}

            {!isLoading && !isError && jobs.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <p className="text-gray-500 font-medium">No jobs match your filters.</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-3 text-sm text-[#1a3a5c] hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {!isLoading && !isError && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const salary    = formatSalary(job.salary_min, job.salary_max)
                  const saved     = bookmarkedIds.has(job.id)
                  const isPending = bookmarkMutation.isPending && bookmarkMutation.variables === job.id
                  return (
                    <a
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#1a3a5c] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500">{job.employer?.name ?? 'Unknown'}</span>
                            {job.location && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-sm text-gray-500">{job.location}</span>
                              </>
                            )}
                            {job.is_remote && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Remote</span>
                              </>
                            )}
                            {job.category && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-sm text-gray-500">{job.category}</span>
                              </>
                            )}
                            {salary && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-sm font-medium text-green-600">{salary}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isStudent && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                bookmarkMutation.mutate(job.id)
                              }}
                              disabled={isPending}
                              title={saved ? 'Remove bookmark' : 'Save job'}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              {saved ? (
                                <svg className="w-5 h-5 text-[#1a3a5c]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M5 4a2 2 0 0 0-2 2v14l9-4 9 4V6a2 2 0 0 0-2-2H5z"/>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 4a2 2 0 0 0-2 2v14l9-4 9 4V6a2 2 0 0 0-2-2H5z"/>
                                </svg>
                              )}
                            </button>
                          )}
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[job.experience_level]}`}>
                              {LEVEL_LABELS[job.experience_level]}
                            </span>
                            {job.job_type && (
                              <span className="text-xs text-gray-500">
                                {JOB_TYPE_LABELS[job.job_type]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{job.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.skills_required.map((skill) => (
                          <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </a>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  disabled={(filters.page ?? 1) <= 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  disabled={(filters.page ?? 1) >= pagination.last_page}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
