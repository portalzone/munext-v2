'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Application } from '@/lib/types'

const STATUS_LABELS: Record<Application['status'], string> = {
  pending:     'Pending',
  reviewed:    'Reviewed',
  shortlisted: 'Shortlisted',
  rejected:    'Rejected',
  hired:       'Hired',
}

const STATUS_COLORS: Record<Application['status'], string> = {
  pending:     'bg-gray-100 text-gray-600',
  reviewed:    'bg-blue-100 text-blue-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  rejected:    'bg-red-100 text-red-700',
  hired:       'bg-green-100 text-green-700',
}

const STATUS_DESCRIPTIONS: Record<Application['status'], string> = {
  pending:     'Your application has been submitted and is awaiting review.',
  reviewed:    'The employer has viewed your application.',
  shortlisted: 'You have been shortlisted for this role.',
  rejected:    'This application was not successful.',
  hired:       'Congratulations — you have been hired for this role.',
}

export default function MyApplicationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.jobs.myApplications(),
  })

  const applications = data?.data ?? []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track the status of every job you have applied for.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/5" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-red-600 font-medium">Failed to load applications.</p>
          </div>
        )}

        {!isLoading && !isError && applications.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-4">You have not applied to any jobs yet.</p>
            <Link
              href="/jobs"
              className="inline-block bg-[#1a3a5c] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#15304d] transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        )}

        {!isLoading && !isError && applications.length > 0 && (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-900 truncate">
                        {app.job?.title ?? `Job #${app.job_id}`}
                      </h2>
                      {app.job?.experience_level && (
                        <span className="text-xs text-gray-500 capitalize">
                          · {app.job.experience_level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {app.applied_at
                        ? new Date(app.applied_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
                        : new Date(app.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {STATUS_DESCRIPTIONS[app.status]}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                    <div className="flex items-center gap-3">
                      {['reviewed', 'shortlisted', 'hired'].includes(app.status) && (
                        <Link
                          href={`/messages/${app.id}`}
                          className="relative inline-flex items-center gap-1 text-xs font-medium text-[#1a3a5c] hover:underline"
                        >
                          Message
                          {(app.unread_messages_count ?? 0) > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                              {app.unread_messages_count}
                            </span>
                          )}
                        </Link>
                      )}
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View job →
                      </Link>
                    </div>
                  </div>
                </div>

                {app.cover_letter && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-600">
                      Show cover letter
                    </summary>
                    <p className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg p-3">
                      {app.cover_letter}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
