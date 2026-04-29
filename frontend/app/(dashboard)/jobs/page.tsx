'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { JobFilters, JobPosting } from '@/lib/types'

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

const CATEGORIES = ['Engineering', 'Design', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Sales', 'Other']

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`
  if (min) return `From $${(min / 1000).toFixed(0)}k`
  return `Up to $${(max! / 1000).toFixed(0)}k`
}

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({ page: 1, per_page: 15 })
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.list(filters),
  })

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
  }

  function setFilter(key: keyof JobFilters, value: string | number | undefined) {
    setFilters(f => ({ ...f, [key]: value || undefined, page: 1 }))
  }

  function clearFilters() {
    setSearch('')
    setFilters({ page: 1, per_page: 15 })
  }

  const jobs        = data?.data ?? []
  const pagination  = data?.pagination
  const hasFilters  = !!(filters.search || filters.category || filters.experience_level || filters.salary_min || filters.salary_max)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header + search */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Postings</h1>
          <form onSubmit={applySearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs by title or keyword..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex gap-6">
          {/* Filter sidebar */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-[#1a3a5c] hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <select
                  value={filters.category ?? ''}
                  onChange={e => setFilter('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Experience level */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Experience</label>
                <select
                  value={filters.experience_level ?? ''}
                  onChange={e => setFilter('experience_level', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="">All levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              {/* Salary min */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Min salary ($)</label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={filters.salary_min ?? ''}
                  onChange={e => setFilter('salary_min', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 40000"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>

              {/* Salary max */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Max salary ($)</label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={filters.salary_max ?? ''}
                  onChange={e => setFilter('salary_max', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 100000"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>
            </div>
          </aside>

          {/* Job list */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : pagination
                  ? `${pagination.total} ${pagination.total === 1 ? 'job' : 'jobs'} found`
                  : ''}
              </p>
            </div>

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

            {/* Error */}
            {isError && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <p className="text-red-600 font-medium">Failed to load jobs.</p>
                <p className="text-gray-500 text-sm mt-1">Make sure you are logged in.</p>
              </div>
            )}

            {/* Empty state */}
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

            {/* Job cards */}
            {!isLoading && !isError && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const salary = formatSalary(job.salary_min, job.salary_max)
                  return (
                    <a
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#1a3a5c] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500">
                              {job.employer?.name ?? 'Unknown'}
                            </span>
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
                        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[job.experience_level]}`}>
                          {LEVEL_LABELS[job.experience_level]}
                        </span>
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
