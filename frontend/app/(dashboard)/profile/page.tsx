'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StudentProfile } from '@/lib/types'

const STORAGE_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1')
  .replace('/api/v1', '')

const STRENGTH_COLORS: Record<string, string> = {
  Weak:      'text-red-600',
  Fair:      'text-orange-500',
  Good:      'text-yellow-600',
  Strong:    'text-blue-600',
  Excellent: 'text-green-600',
}

const STRENGTH_BG: Record<string, string> = {
  Weak:      'bg-red-500',
  Fair:      'bg-orange-400',
  Good:      'bg-yellow-400',
  Strong:    'bg-blue-500',
  Excellent: 'bg-green-500',
}

type ProfileForm = Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'user'>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ProfileForm>({
    program:         '',
    gpa:             null,
    graduation_year: new Date().getFullYear() + 1,
    skills:          [],
    resume_path:     null,
  })
  const [skillInput, setSkillInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [resumeSuccess, setResumeSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.students.myProfile(),
  })

  const { data: strengthData } = useQuery({
    queryKey: ['profile-strength'],
    queryFn: () => api.ml.profileStrength(),
  })

  const { data: recsData } = useQuery({
    queryKey: ['job-recommendations'],
    queryFn: () => api.ml.jobRecommendations(6),
    enabled: !!data?.data,
  })

  const createMutation = useMutation({
    mutationFn: () => api.students.createProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      setEditing(false)
      setErrorMessage(null)
    },
    onError: () => setErrorMessage('Failed to create profile. Please try again.'),
  })

  const updateMutation = useMutation({
    mutationFn: (id: number) => api.students.updateProfile(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      setEditing(false)
      setErrorMessage(null)
    },
    onError: () => setErrorMessage('Failed to update profile. Please try again.'),
  })

  const resumeMutation = useMutation({
    mutationFn: (file: File) => api.students.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      queryClient.invalidateQueries({ queryKey: ['profile-strength'] })
      setResumeSuccess(true)
      setResumeError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err: { error?: string }) => {
      setResumeError(err?.error ?? 'Upload failed. Try again.')
      setResumeSuccess(false)
    },
  })

  function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeError(null)
    setResumeSuccess(false)
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      setResumeError('Only PDF, DOC, and DOCX files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File must be under 5 MB.')
      return
    }
    resumeMutation.mutate(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'gpa' || name === 'graduation_year' ? Number(value) : value }))
  }

  function addSkill() {
    const skill = skillInput.trim()
    if (skill && !form.skills.includes(skill)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }))
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))
  }

  function startEdit(profile?: StudentProfile) {
    if (profile) {
      setForm({
        program:         profile.program,
        gpa:             profile.gpa,
        graduation_year: profile.graduation_year,
        skills:          profile.skills,
        resume_path:     profile.resume_path,
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </main>
    )
  }

  const profile = data?.data ?? null

  if (!profile && !editing) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-4">You haven&apos;t created a profile yet.</p>
            <button
              onClick={() => startEdit()}
              className="bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
            >
              Create Profile
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (editing) {
    const isPending = createMutation.isPending || updateMutation.isPending

    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {profile ? 'Edit Profile' : 'Create Profile'}
          </h1>

          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <input
                type="text"
                name="program"
                value={form.program}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GPA (optional)</label>
                <input
                  type="number"
                  name="gpa"
                  value={form.gpa ?? ''}
                  onChange={handleChange}
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder="0.00 – 4.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                <input
                  type="number"
                  name="graduation_year"
                  value={form.graduation_year}
                  onChange={handleChange}
                  min={2000}
                  max={2100}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
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
                {form.skills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1.5 bg-[#1a3a5c] text-white text-xs px-2.5 py-1 rounded-full">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-300 transition-colors">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => profile ? updateMutation.mutate(profile.id) : createMutation.mutate()}
                disabled={isPending}
                className="bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => startEdit(profile!)}
            className="text-sm text-[#1a3a5c] font-medium hover:underline"
          >
            Edit
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Program</p>
              <p className="text-sm font-semibold text-gray-900">{profile!.program}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">GPA</p>
              <p className="text-sm font-semibold text-gray-900">{profile!.gpa ?? '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Graduating</p>
              <p className="text-sm font-semibold text-gray-900">{profile!.graduation_year}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {profile!.skills.map((skill) => (
                <span key={skill} className="text-xs bg-[#1a3a5c] text-white px-2.5 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Resume Card */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Resume</h2>
          </div>

          {profile!.resume_path ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <svg className="w-8 h-8 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {profile!.resume_path.split('/').pop()}
                </p>
                <p className="text-xs text-gray-400">Uploaded resume</p>
              </div>
              <a
                href={`${STORAGE_BASE}/storage/${profile!.resume_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                Download
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">No resume uploaded yet.</p>
          )}

          {resumeSuccess && (
            <p className="text-sm text-green-600 mb-3">Resume uploaded successfully.</p>
          )}
          {resumeError && (
            <p className="text-sm text-red-600 mb-3">{resumeError}</p>
          )}

          <label className="cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={handleResumeChange}
              disabled={resumeMutation.isPending}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              {resumeMutation.isPending ? (
                'Uploading...'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {profile!.resume_path ? 'Replace Resume' : 'Upload Resume'}
                </>
              )}
            </span>
          </label>
          <p className="text-xs text-gray-400 mt-2">PDF, DOC or DOCX · max 5 MB</p>
        </div>

        {/* Profile Strength Card */}
        {strengthData?.data && (() => {
          const s = strengthData.data
          const breakdown = [
            { label: 'Profile completeness', value: s.breakdown.completeness, max: 30 },
            { label: 'Skills count',          value: s.breakdown.skills,       max: 25 },
            { label: 'Resume uploaded',       value: s.breakdown.resume,       max: 20 },
            { label: 'Application activity',  value: s.breakdown.activity,     max: 25 },
          ]
          return (
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900">Profile Strength</h2>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${STRENGTH_COLORS[s.label] ?? 'text-gray-700'}`}>
                    {s.score}
                  </span>
                  <span className="text-gray-400 text-sm">/100</span>
                  <p className={`text-xs font-semibold mt-0.5 ${STRENGTH_COLORS[s.label] ?? 'text-gray-500'}`}>
                    {s.label}
                  </p>
                </div>
              </div>

              {/* Overall bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5">
                <div
                  className={`h-2.5 rounded-full transition-all ${STRENGTH_BG[s.label] ?? 'bg-gray-400'}`}
                  style={{ width: `${s.score}%` }}
                />
              </div>

              {/* Component breakdown */}
              <div className="space-y-3">
                {breakdown.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{item.label}</span>
                      <span>{item.value}/{item.max}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#1a3a5c] h-1.5 rounded-full transition-all"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {s.score < 100 && (
                <p className="mt-4 text-xs text-gray-400">
                  {s.breakdown.resume === 0 && 'Upload a resume to gain 20 points. '}
                  {s.breakdown.skills < 25 && `Add ${Math.ceil(((25 - s.breakdown.skills) / 25) * 10)} more skills to improve your score. `}
                </p>
              )}
            </div>
          )
        })()}

        {/* Job Recommendations */}
        {recsData?.data && recsData.data.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Recommended for You</h2>
                <p className="text-xs text-gray-400 mt-0.5">Based on your skills — sorted by match score</p>
              </div>
              <Link href="/jobs" className="text-xs text-blue-600 hover:underline">
                Browse all →
              </Link>
            </div>
            <div className="space-y-3">
              {recsData.data.map(rec => (
                <Link
                  key={rec.job.id}
                  href={`/jobs/${rec.job.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                      {rec.job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {rec.job.category && (
                        <span className="text-xs text-gray-400">{rec.job.category}</span>
                      )}
                      {rec.job.experience_level && (
                        <span className="text-xs text-gray-400 capitalize">· {rec.job.experience_level}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      rec.score >= 75 ? 'bg-green-100 text-green-700' :
                      rec.score >= 50 ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.score}% match
                    </span>
                    <span className="text-gray-300 text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
