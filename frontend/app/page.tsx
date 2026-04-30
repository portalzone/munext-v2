'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { JobPosting, JobType } from '@/lib/types'

const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time':  'Full-time',
  'part-time':  'Part-time',
  'contract':   'Contract',
  'internship': 'Internship',
}

const LEVEL_LABELS: Record<JobPosting['experience_level'], string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  if (min) return `From $${min.toLocaleString()}`
  return `Up to $${max!.toLocaleString()}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA')
}

export default function HomePage() {
  const queryClient = useQueryClient()

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    retry: false,
  })

  const isStudent = meData?.data.role === 'student' || meData?.data.role === 'alumni'

  const { data: recentData, isLoading } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: () => api.jobs.list({ per_page: 6, sort: 'newest' }),
  })

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

  const recentJobs = recentData?.data ?? []

  return (
    <main className="flex-1 bg-gray-50">

      {/* Hero */}
      <section className="bg-[#1a3a5c] text-white py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold leading-tight">
            Your career starts at MUN.
          </h1>
          <p className="mt-5 text-blue-200 text-lg leading-relaxed max-w-xl mx-auto">
            MUNext connects Memorial University students and alumni with employers across Newfoundland.
            Find jobs that match your skills, apply with confidence.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-[#1a3a5c] px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="border border-blue-300 text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#15304d] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#1a3a5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">For Students & Alumni</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Build your profile, list your skills, and see your skill match score before applying.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#1a3a5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">For Employers</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Post jobs, define required skills, and review applicants from MUN's talent pool.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#1a3a5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Skill Matching</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Our ML algorithm scores your fit for every job and shows you what to build next.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Opportunities */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Opportunities</h2>
              <p className="text-sm text-gray-500 mt-1">Start your job search with these latest postings</p>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-[#1a3a5c] hover:underline">
              View All Jobs →
            </Link>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && recentJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No job postings yet.</p>
            </div>
          )}

          {!isLoading && recentJobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map((job) => {
                const salary    = formatSalary(job.salary_min, job.salary_max)
                const saved     = bookmarkedIds.has(job.id)
                const isPending = bookmarkMutation.isPending && bookmarkMutation.variables === job.id

                return (
                  <div key={job.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{job.employer?.name ?? 'Unknown'}</p>
                      </div>
                      {isStudent && (
                        <button
                          onClick={() => bookmarkMutation.mutate(job.id)}
                          disabled={isPending}
                          title={saved ? 'Remove bookmark' : 'Save job'}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {saved ? (
                            <svg className="w-4 h-4 text-[#1a3a5c]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5 4a2 2 0 0 0-2 2v14l9-4 9 4V6a2 2 0 0 0-2-2H5z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 4a2 2 0 0 0-2 2v14l9-4 9 4V6a2 2 0 0 0-2-2H5z"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.job_type && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {JOB_TYPE_LABELS[job.job_type]}
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {LEVEL_LABELS[job.experience_level]}
                      </span>
                      {job.is_remote && (
                        <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Remote</span>
                      )}
                    </div>

                    {job.location && (
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {job.location}
                      </p>
                    )}

                    {salary && (
                      <p className="text-xs font-medium text-green-600 mb-1">{salary}</p>
                    )}

                    <p className="text-xs text-gray-400 mb-3">{formatDate(job.created_at)}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills_required.slice(0, 4).map((skill) => (
                        <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {job.skills_required.length > 4 && (
                        <span className="text-xs text-gray-400">+{job.skills_required.length - 4}</span>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-[#1a3a5c] hover:underline">
                        View Details →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

    </main>
  )
}
