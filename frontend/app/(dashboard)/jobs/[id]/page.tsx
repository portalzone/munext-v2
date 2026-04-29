'use client'

import { use, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/types'

const LEVEL_LABELS = { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level' }

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`
  if (min) return `From $${(min / 1000).toFixed(0)}k`
  return `Up to $${(max! / 1000).toFixed(0)}k`
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const jobId = Number(id)

  const [showApplyForm, setShowApplyForm] = useState(false)
  const [coverLetter, setCoverLetter]     = useState('')
  const [applyError, setApplyError]       = useState<string | null>(null)
  const [applied, setApplied]             = useState(false)

  const { data: jobData, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.jobs.get(jobId),
  })

  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['match', jobId],
    queryFn: () => api.jobs.match(jobId),
  })

  const applyMutation = useMutation({
    mutationFn: () => api.jobs.apply(jobId, coverLetter),
    onSuccess: () => {
      setApplied(true)
      setShowApplyForm(false)
    },
    onError: (error: ApiError) => {
      setApplyError(error.message ?? 'Application failed. Please try again.')
    },
  })

  if (jobLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="bg-white rounded-xl p-6 shadow-sm h-40" />
        </div>
      </main>
    )
  }

  const job   = jobData?.data
  const match = matchData?.data

  if (!job) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Job not found.</p>
      </main>
    )
  }

  const salary    = formatSalary(job.salary_min, job.salary_max)
  const chartData = match
    ? [
        ...match.matched_skills.map((skill) => ({ skill, status: 'Matched', value: 1 })),
        ...match.missing_skills.map((skill) => ({ skill, status: 'Missing', value: 1 })),
      ]
    : []

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Job Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                <span>{job.employer?.name}</span>
                <span className="text-gray-300">·</span>
                <span>{LEVEL_LABELS[job.experience_level]}</span>
                {job.category && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{job.category}</span>
                  </>
                )}
                {salary && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-green-600 font-medium">{salary}</span>
                  </>
                )}
              </div>
            </div>

            {applied ? (
              <span className="shrink-0 bg-green-50 text-green-700 px-5 py-2.5 rounded-lg text-sm font-semibold">
                Applied ✓
              </span>
            ) : (
              <button
                onClick={() => { setShowApplyForm(true); setApplyError(null) }}
                className="shrink-0 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
              >
                Apply Now
              </button>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{job.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills_required.map((skill) => (
              <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Cover Letter Form */}
        {showApplyForm && !applied && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#1a3a5c]">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Write your cover letter</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tell the employer why you are a great fit. Minimum 50 characters.
            </p>

            {applyError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {applyError}
              </div>
            )}

            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              placeholder="I am excited to apply for this role because..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-1 mb-4">
              <span className={`text-xs ${coverLetter.length < 50 ? 'text-red-500' : 'text-gray-400'}`}>
                {coverLetter.length} / 5000 characters {coverLetter.length < 50 ? `(${50 - coverLetter.length} more needed)` : ''}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => applyMutation.mutate()}
                disabled={coverLetter.length < 50 || applyMutation.isPending}
                className="bg-[#1a3a5c] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                onClick={() => { setShowApplyForm(false); setApplyError(null) }}
                className="text-gray-500 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Skill Match Results */}
        {matchLoading ? (
          <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-48" />
        ) : match ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Your Skill Match</h2>
              <div className="text-right">
                <span className="text-3xl font-bold text-[#1a3a5c]">{match.score}%</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {match.matched_skills.length} of {match.matched_skills.length + match.missing_skills.length} skills matched
                </p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip formatter={() => ''} labelFormatter={(label) => label} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.status === 'Matched' ? '#16a34a' : '#dc2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">Matched Skills</p>
                {match.matched_skills.length === 0 ? (
                  <p className="text-sm text-gray-400">None</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {match.matched_skills.map((skill) => (
                      <span key={skill} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Missing Skills</p>
                {match.missing_skills.length === 0 ? (
                  <p className="text-sm text-gray-400">None — perfect match!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {match.missing_skills.map((skill) => (
                      <span key={skill} className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </main>
  )
}
