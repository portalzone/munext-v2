'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Application, SkillMatch } from '@/lib/types'

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
  rejected:    ['reviewed'],
}

function scoreColor(score: number) {
  if (score >= 75) return 'text-green-600 bg-green-50'
  if (score >= 50) return 'text-blue-600 bg-blue-50'
  if (score >= 25) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

function ApplicantCard({
  app,
  jobId,
  onStatusChange,
  isPending,
}: {
  app: Application
  jobId: number
  onStatusChange: (appId: number, status: Application['status']) => void
  isPending: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const { data: matchData } = useQuery({
    queryKey: ['applicant-match', jobId, app.student_id],
    queryFn: () => api.ml.applicantMatch(jobId, app.student_id),
    enabled: !!app.student_id,
    staleTime: 5 * 60 * 1000,
  })

  const match: SkillMatch | null = matchData?.data ?? null
  const nextStatuses = NEXT_STATUSES[app.status] ?? []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Collapsed row */}
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
        onClick={() => setIsOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {app.student?.name ?? `Applicant #${app.id}`}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {app.student?.email ?? ''}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {match !== null && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreColor(match.score)}`}>
              {match.score}% match
            </span>
          )}
          {(app.unread_messages_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              {app.unread_messages_count} new
            </span>
          )}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
          <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="px-6 pb-5 border-t border-gray-100 pt-4 space-y-5">

          {/* Skill match breakdown */}
          {match !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Skill Match
                </h3>
                <span className={`text-sm font-bold ${scoreColor(match.score).split(' ')[0]}`}>
                  {match.score} / 100
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full bg-[#1a3a5c] transition-all"
                  style={{ width: `${match.score}%` }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-1">Matched ({match.matched_skills.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {match.matched_skills.length > 0
                      ? match.matched_skills.map(s => (
                          <span key={s} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
                        ))
                      : <span className="text-gray-300">None</span>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Missing ({match.missing_skills.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {match.missing_skills.length > 0
                      ? match.missing_skills.map(s => (
                          <span key={s} className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))
                      : <span className="text-gray-300">None</span>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Extra ({match.extra_skills.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {match.extra_skills.length > 0
                      ? match.extra_skills.map(s => (
                          <span key={s} className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))
                      : <span className="text-gray-300">None</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cover letter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Cover Letter
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {app.cover_letter ?? 'No cover letter provided.'}
            </p>
          </div>

          {/* Message link — only available once reviewed or above */}
          {['reviewed', 'shortlisted', 'hired'].includes(app.status) && (
            <Link
              href={`/messages/${app.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a3a5c] hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Open conversation
            </Link>
          )}

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">Move to:</span>
              {nextStatuses.map(status => (
                <button
                  key={status}
                  disabled={isPending}
                  onClick={() => onStatusChange(app.id, status)}
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
            <p className="text-sm text-green-600 font-medium">Hired — no further actions needed.</p>
          )}
        </div>
      )}
    </div>
  )
}

type TabStatus = 'all' | Application['status']

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'pending',     label: 'Pending' },
  { key: 'reviewed',    label: 'Reviewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'hired',       label: 'Hired' },
  { key: 'rejected',    label: 'Rejected' },
]

const TAB_COLORS: Record<TabStatus, string> = {
  all:         'bg-gray-100 text-gray-600',
  pending:     'bg-gray-100 text-gray-600',
  reviewed:    'bg-blue-100 text-blue-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  hired:       'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
}

export default function ApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router      = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab]         = useState<TabStatus>('all')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastMsg, setBroadcastMsg]   = useState('')

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

  const broadcastMutation = useMutation({
    mutationFn: (body: string) => api.messages.broadcast(Number(jobId), body),
    onSuccess: (res) => {
      setBroadcastMsg(`Message sent to ${res.data.sent_to} applicant(s).`)
      setBroadcastBody('')
      setShowBroadcast(false)
    },
  })

  const applicants = data?.data ?? []
  const job        = jobData?.data

  const countFor = (tab: TabStatus) =>
    tab === 'all' ? applicants.length : applicants.filter(a => a.status === tab).length

  const visible = activeTab === 'all'
    ? applicants
    : applicants.filter(a => a.status === activeTab)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        <button
          onClick={() => router.push('/employer')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back to dashboard
        </button>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {job ? `Applicants — ${job.title}` : 'Applicants'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-1">
              {applicants.length} {applicants.length === 1 ? 'application' : 'applications'} total
            </p>
          )}
        </div>

        {/* Broadcast button */}
        {!isLoading && !isError && applicants.length > 0 && (
          <div className="mb-4">
            {broadcastMsg && (
              <p className="text-sm text-green-600 mb-2">{broadcastMsg}</p>
            )}
            {!showBroadcast ? (
              <button
                onClick={() => { setShowBroadcast(true); setBroadcastMsg('') }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Message all eligible applicants
              </button>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Send to all reviewed, shortlisted, and hired applicants
                </p>
                <textarea
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  placeholder="e.g. We will be in touch next week regarding next steps."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => broadcastMutation.mutate(broadcastBody)}
                    disabled={!broadcastBody.trim() || broadcastMutation.isPending}
                    className="px-4 py-2 bg-[#1a3a5c] text-white text-sm font-medium rounded-lg hover:bg-[#15304d] disabled:opacity-50 transition-colors"
                  >
                    {broadcastMutation.isPending ? 'Sending…' : 'Send'}
                  </button>
                  <button
                    onClick={() => { setShowBroadcast(false); setBroadcastBody('') }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status tabs */}
        {!isLoading && !isError && applicants.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {TABS.map(tab => {
              const count  = countFor(tab.key)
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'border-[#1a3a5c] bg-[#1a3a5c] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-white/20 text-white' : TAB_COLORS[tab.key]
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

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

        {!isLoading && !isError && applicants.length > 0 && visible.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">
              No <span className="font-medium text-gray-600">{STATUS_LABELS[activeTab as Application['status']]}</span> applications yet.
            </p>
          </div>
        )}

        {!isLoading && !isError && visible.length > 0 && (
          <div className="space-y-3">
            {visible.map(app => (
              <ApplicantCard
                key={app.id}
                app={app}
                jobId={Number(jobId)}
                onStatusChange={(appId, status) => statusMutation.mutate({ appId, status })}
                isPending={statusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
