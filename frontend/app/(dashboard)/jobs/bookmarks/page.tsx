'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { JobPosting } from '@/lib/types'

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

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`
  if (min) return `From $${(min / 1000).toFixed(0)}k`
  return `Up to $${(max! / 1000).toFixed(0)}k`
}

export default function SavedJobsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.jobs.bookmarks(),
  })

  const removeMutation = useMutation({
    mutationFn: (jobId: number) => api.jobs.toggleBookmark(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const jobs = data?.data ?? []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Jobs you have bookmarked for later.</p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-red-600 font-medium">Failed to load saved jobs.</p>
          </div>
        )}

        {!isLoading && !isError && jobs.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 4a2 2 0 0 0-2 2v14l9-4 9 4V6a2 2 0 0 0-2-2H5z"/>
            </svg>
            <p className="text-gray-500 font-medium">No saved jobs yet.</p>
            <a href="/jobs" className="mt-3 inline-block text-sm text-[#1a3a5c] hover:underline">
              Browse jobs
            </a>
          </div>
        )}

        {!isLoading && !isError && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => {
              const salary    = formatSalary(job.salary_min, job.salary_max)
              const isPending = removeMutation.isPending && removeMutation.variables === job.id
              return (
                <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <a href={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-[#1a3a5c] transition-colors">
                        {job.title}
                      </a>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-500">{job.employer?.name ?? 'Unknown'}</span>
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
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[job.experience_level]}`}>
                        {LEVEL_LABELS[job.experience_level]}
                      </span>
                      <button
                        onClick={() => removeMutation.mutate(job.id)}
                        disabled={isPending}
                        title="Remove bookmark"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 4a2 2 0 0 0-2 2v14l9-4 9 4V6a2 2 0 0 0-2-2H5z"/>
                        </svg>
                      </button>
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

                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <a
                      href={`/jobs/${job.id}`}
                      className="bg-[#1a3a5c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
                    >
                      View Job
                    </a>
                    <button
                      onClick={() => removeMutation.mutate(job.id)}
                      disabled={isPending}
                      className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {isPending ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
