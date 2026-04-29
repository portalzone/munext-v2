'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const NEXT_STATUSES: Partial<Record<Application['status'], Application['status'][]>> = {
  pending:     ['reviewed', 'rejected'],
  reviewed:    ['shortlisted', 'rejected'],
  shortlisted: ['hired', 'rejected'],
}

export default function ApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router     = useRouter()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: jobData } = useQuery({
    queryKey: ['job', Number(jobId)],
    queryFn: () => api.jobs.get(Number(jobId)),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['applicants', Number(jobId)],
    queryFn: () => api.jobs.applicants(Number(jobId)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: number; status: Application['status'] }) =>
      api.jobs.updateStatus(Number(jobId), appId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants', Number(jobId)] })
    },
  })

  const applicants = data?.data ?? []
  const job        = jobData?.data

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Back + header */}
        <button
          onClick={() => router.push('/employer')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back to dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {job ? `Applicants — ${job.title}` : 'Applicants'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-1">
              {applicants.length} {applicants.length === 1 ? 'application' : 'applications'}
            </p>
          )}
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
            <p className="text-red-600 font-medium">Failed to load applicants.</p>
          </div>
        )}

        {!isLoading && !isError && applicants.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-500">No applications yet for this job.</p>
          </div>
        )}

        {!isLoading && !isError && applicants.length > 0 && (
          <div className="space-y-3">
            {applicants.map((app) => {
              const isOpen = expanded === app.id
              const nextStatuses = NEXT_STATUSES[app.status] ?? []
              return (
                <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  {/* Applicant header row */}
                  <button
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {app.student?.name ?? `Applicant #${app.id}`}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {app.student?.email ?? ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                      <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded: cover letter + actions */}
                  {isOpen && (
                    <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Cover Letter
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {app.cover_letter ?? 'No cover letter provided.'}
                      </p>

                      {nextStatuses.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="text-sm text-gray-500 self-center">Move to:</span>
                          {nextStatuses.map(status => (
                            <button
                              key={status}
                              disabled={statusMutation.isPending}
                              onClick={() => statusMutation.mutate({ appId: app.id, status })}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                status === 'rejected'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : status === 'hired'
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      )}

                      {app.status === 'hired' && (
                        <p className="mt-4 text-sm text-green-600 font-medium">
                          Hired — no further actions needed.
                        </p>
                      )}
                      {app.status === 'rejected' && (
                        <p className="mt-4 text-sm text-red-500">
                          Application rejected.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
