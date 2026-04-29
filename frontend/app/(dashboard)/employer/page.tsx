'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { JobPosting } from '@/lib/types'

type JobForm = Omit<JobPosting, 'id' | 'employer_id' | 'created_at' | 'updated_at' | 'employer'>

const EMPTY_FORM: JobForm = {
  title: '',
  description: '',
  skills_required: [],
  experience_level: 'entry',
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

  const { data, isLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => api.jobs.myJobs(),
  })

  const createMutation = useMutation({
    mutationFn: () => api.jobs.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
      resetForm()
    },
    onError: () => setErrorMessage('Failed to create job posting.'),
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

  const jobs = data?.data ?? []
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">{jobs.length} {jobs.length === 1 ? 'job posting' : 'job postings'}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#1a3a5c] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
            >
              + Post a Job
            </button>
          )}
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
                    <p className="text-sm text-gray-500 mt-0.5">
                      Posted {new Date(job.created_at).toLocaleDateString()}
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

                <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => startEdit(job)}
                    className="text-sm text-[#1a3a5c] font-medium hover:underline"
                  >
                    Edit
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
      </div>
    </main>
  )
}
