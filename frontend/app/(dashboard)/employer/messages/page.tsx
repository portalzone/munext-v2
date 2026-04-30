'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Application, JobPosting } from '@/lib/types'

const MESSAGING_STATUSES: Application['status'][] = ['reviewed', 'shortlisted', 'hired']

const STATUS_COLORS: Record<Application['status'], string> = {
  pending:     'bg-gray-100 text-gray-600',
  reviewed:    'bg-blue-100 text-blue-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  rejected:    'bg-red-100 text-red-700',
  hired:       'bg-green-100 text-green-700',
}

function JobSection({ job }: { job: JobPosting }) {
  const { data, isLoading } = useQuery({
    queryKey: ['applicants', job.id],
    queryFn: () => api.jobs.applicants(job.id),
    staleTime: 30000,
  })

  const eligible = (data?.data ?? [])
    .filter(a => MESSAGING_STATUSES.includes(a.status))
    .sort((a, b) => (b.unread_messages_count ?? 0) - (a.unread_messages_count ?? 0))

  // Hide section once loaded if no eligible threads
  if (!isLoading && eligible.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide truncate">
          {job.title}
        </h2>
        <Link
          href={`/employer/applicants/${job.id}`}
          className="text-xs text-[#1a3a5c] hover:underline shrink-0 ml-4"
        >
          All applicants
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {eligible.map(app => {
          const unread = app.unread_messages_count ?? 0
          return (
            <Link
              key={app.id}
              href={`/messages/${app.id}`}
              className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-[#1a3a5c] hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1a3a5c]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#1a3a5c]">
                    {(app.student?.name ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {app.student?.name ?? `Applicant #${app.student_id}`}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{app.student?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status]}`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
                {unread > 0 ? (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 leading-none">
                    {unread} new
                  </span>
                ) : (
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#1a3a5c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default function EmployerMessagesPage() {
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => api.jobs.myJobs({ per_page: 100 }),
  })

  const jobs = jobsData?.data ?? []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            Conversations with reviewed, shortlisted, and hired applicants.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-40 mb-3 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No jobs posted yet.</p>
            <Link href="/employer" className="mt-3 inline-block text-sm text-[#1a3a5c] font-medium hover:underline">
              Post a job →
            </Link>
          </div>
        )}

        {!isLoading && jobs.length > 0 && (
          <div className="space-y-8">
            {jobs.map(job => (
              <JobSection key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
