'use client'

import { useQuery } from '@tanstack/react-query'
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

export default function JobsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  })

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Job Postings</h1>
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
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load job postings.</p>
          <p className="text-gray-500 text-sm mt-1">Make sure you are logged in.</p>
        </div>
      </main>
    )
  }

  const jobs = data?.data ?? []

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <span className="text-sm text-gray-500">{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available</span>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-500">No job postings yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <a key={job.id} href={`/jobs/${job.id}`} className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#1a3a5c] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Posted by {job.employer?.name ?? 'Unknown'}
                    </p>
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
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
