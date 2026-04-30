'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import { JobPosting } from '@/lib/types'

type JobForm = Omit<JobPosting, 'id' | 'employer_id' | 'created_at' | 'updated_at' | 'employer'>

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

const EMPTY_FORM: JobForm = {
  title: '',
  description: '',
  skills_required: [],
  experience_level: 'entry',
  category: null,
  job_type: null,
  location: null,
  is_remote: false,
  salary_min: null,
  salary_max: null,
  is_active: true,
}

const LEVEL_LABELS: Record<JobPosting['experience_level'], string> = {
  entry:  'Entry Level',
  mid:    'Mid Level',
  senior: 'Senior Level',
}

const LEVEL_COLORS: Record<JobPosting['experience_level'], string> = {
  entry:  'bg-green-100 text-green-700',
  mid:    'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
}

export default function EmployerDashboard() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [form, setForm] = useState<JobForm>(EMPTY_FORM)
  const [skillInput, setSkillInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-jobs', sort, page],
    queryFn: () => api.jobs.myJobs({ sort, page, per_page: 10 }),
  })

  const { data: funnelData } = useQuery({
    queryKey: ['hiring-funnel'],
    queryFn: () => api.ml.hiringFunnel(),
  })

  const createMutation = useMutation({
    mutationFn: () => api.jobs.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
      resetForm()
    },
    onError: () => setErrorMessage('Failed to create job posting.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.jobs.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-jobs'] }),
  })

  const updateMutation = useMutation({
    mutationFn: (id: number) => api.jobs.update(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
      resetForm()
    },
    onError: () => setErrorMessage('Failed to update job posting.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.jobs.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-jobs'] }),
  })

  function resetForm() {
    setForm(EMPTY_FORM)
    setSkillInput('')
    setShowForm(false)
    setEditingJob(null)
    setErrorMessage(null)
  }

  function startEdit(job: JobPosting) {
    setForm({
      title:            job.title,
      description:      job.description,
      skills_required:  job.skills_required,
      experience_level: job.experience_level,
      category:         job.category,
      job_type:         job.job_type,
      location:         job.location,
      is_remote:        job.is_remote,
      salary_min:       job.salary_min,
      salary_max:       job.salary_max,
      is_active:        job.is_active,
    })
    setEditingJob(job)
    setShowForm(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function addSkill() {
    const skill = skillInput.trim()
    if (skill && !form.skills_required.includes(skill)) {
      setForm((prev) => ({ ...prev, skills_required: [...prev.skills_required, skill] }))
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setForm((prev) => ({ ...prev, skills_required: prev.skills_required.filter((s) => s !== skill) }))
  }

  const jobs       = data?.data ?? []
  const pagination = data?.pagination
  const isPending  = createMutation.isPending || updateMutation.isPending

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination ? `${pagination.total} ${pagination.total === 1 ? 'job posting' : 'job postings'}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="active">Active first</option>
              <option value="inactive">Inactive first</option>
            </select>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#1a3a5c] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
              >
                + Post a Job
              </button>
            )}
          </div>
        </div>

        {/* Job Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingJob ? 'Edit Job Posting' : 'New Job Posting'}
            </h2>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Backend Developer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the role and responsibilities..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  name="experience_level"
                  value={form.experience_level}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value || null }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="">Select a category (optional)</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    name="job_type"
                    value={form.job_type ?? ''}
                    onChange={(e) => setForm(prev => ({ ...prev, job_type: (e.target.value as JobForm['job_type']) || null }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  >
                    <option value="">Not specified</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location ?? ''}
                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value || null }))}
                    placeholder="e.g. St. John's, NL"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_remote ?? false}
                  onChange={(e) => setForm(prev => ({ ...prev, is_remote: e.target.checked }))}
                  className="w-4 h-4 accent-[#1a3a5c]"
                />
                <span className="text-sm text-gray-700">Remote position</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.salary_min ?? ''}
                    onChange={(e) => setForm(prev => ({ ...prev, salary_min: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 50000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.salary_max ?? ''}
                    onChange={(e) => setForm(prev => ({ ...prev, salary_max: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 80000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Type a skill and press Enter"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills_required.map((skill) => (
                    <span key={skill} className="flex items-center gap-1.5 bg-[#1a3a5c] text-white text-xs px-2.5 py-1 rounded-full">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-red-300 transition-colors">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => editingJob ? updateMutation.mutate(editingJob.id) : createMutation.mutate()}
                  disabled={isPending}
                  className="bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                </button>
                <button
                  onClick={resetForm}
                  className="text-gray-500 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Listings */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">You haven&apos;t posted any jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-gray-500">
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      {job.job_type && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="capitalize">{job.job_type}</span>
                        </>
                      )}
                      {job.location && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{job.location}</span>
                        </>
                      )}
                      {job.is_remote && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-teal-600 font-medium">Remote</span>
                        </>
                      )}
                      {job.category && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{job.category}</span>
                        </>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-green-600 font-medium">
                            {job.salary_min && job.salary_max
                              ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`
                              : job.salary_min
                              ? `From $${(job.salary_min / 1000).toFixed(0)}k`
                              : `Up to $${(job.salary_max! / 1000).toFixed(0)}k`}
                          </span>
                        </>
                      )}
                      <span className="text-gray-300">·</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
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

                <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                  <a
                    href={`/employer/applicants/${job.id}`}
                    className="text-sm text-gray-600 font-medium hover:underline"
                  >
                    View applicants
                  </a>
                  <button
                    onClick={() => startEdit(job)}
                    className="text-sm text-[#1a3a5c] font-medium hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: job.id, is_active: !job.is_active })}
                    disabled={toggleMutation.isPending}
                    className={`text-sm font-medium hover:underline disabled:opacity-50 ${job.is_active ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    {job.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(job.id)}
                    disabled={deleteMutation.isPending}
                    className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.last_page}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
        {/* Hiring Funnel — Algorithm 3 */}
        {funnelData?.data?.jobs && funnelData.data.jobs.length > 0 && (() => {
          const chartData = funnelData.data.jobs.map(f => ({
            name: f.job_title.length > 20 ? f.job_title.slice(0, 20) + '…' : f.job_title,
            Applied:     f.stages.applied,
            Reviewed:    f.stages.reviewed,
            Shortlisted: f.stages.shortlisted,
            Hired:       f.stages.hired,
          }))
          return (
            <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Hiring Funnel</h2>
              <p className="text-xs text-gray-400 mb-5">Applicant progression across pipeline stages for each job.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                  <Bar dataKey="Applied"     fill="#93c5fd" radius={[3,3,0,0]} />
                  <Bar dataKey="Reviewed"    fill="#60a5fa" radius={[3,3,0,0]} />
                  <Bar dataKey="Shortlisted" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Hired"       fill="#1d4ed8" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Conversion rates table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-xs text-gray-600">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 font-medium text-gray-500">Job</th>
                      <th className="pb-2 font-medium text-gray-500 text-right">→ Reviewed</th>
                      <th className="pb-2 font-medium text-gray-500 text-right">→ Shortlisted</th>
                      <th className="pb-2 font-medium text-gray-500 text-right">→ Hired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnelData.data.jobs.map(f => (
                      <tr key={f.job_id} className="border-b border-gray-50">
                        <td className="py-2 pr-4 max-w-40 truncate">{f.job_title}</td>
                        <td className="py-2 text-right">{f.conversion_rates.to_reviewed.toFixed(1)}%</td>
                        <td className="py-2 text-right">{f.conversion_rates.to_shortlisted.toFixed(1)}%</td>
                        <td className="py-2 text-right">{f.conversion_rates.to_hired.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </div>
    </main>
  )
}
