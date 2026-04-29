'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StudentProfile } from '@/lib/types'

type ProfileForm = Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'user'>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ProfileForm>({
    program: '',
    gpa: null,
    graduation_year: new Date().getFullYear() + 1,
    skills: [],
  })
  const [skillInput, setSkillInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.students.list(),
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
        program: profile.program,
        gpa: profile.gpa,
        graduation_year: profile.graduation_year,
        skills: profile.skills,
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

  // Find the current user's profile from the list
  // In a real app we'd have a /me endpoint — for now we grab the first result
  const profiles = data?.data ?? []
  const profile = profiles.length > 0 ? profiles[0] : null

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
      </div>
    </main>
  )
}
