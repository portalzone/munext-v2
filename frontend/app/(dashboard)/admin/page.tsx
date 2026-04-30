'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import { User, JobPosting } from '@/lib/types'

const ROLE_COLORS: Record<User['role'], string> = {
  student:  'bg-blue-100 text-blue-700',
  employer: 'bg-purple-100 text-purple-700',
  admin:    'bg-gray-100 text-gray-700',
}

type AdminTab = 'overview' | 'users' | 'jobs' | 'ml'

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [tab, setTab]             = useState<AdminTab>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole]   = useState('')
  const [userPage, setUserPage]   = useState(1)
  const [jobSearch, setJobSearch] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const [jobPage, setJobPage]     = useState(1)

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.admin.stats(),
  })

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userSearch, userRole, userPage],
    queryFn: () => api.admin.users({ search: userSearch || undefined, role: userRole || undefined, page: userPage }),
    enabled: tab === 'users',
  })

  // Jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs', jobSearch, jobStatus, jobPage],
    queryFn: () => api.admin.jobs({ search: jobSearch || undefined, status: jobStatus || undefined, page: jobPage }),
    enabled: tab === 'jobs',
  })

  // ML trends
  const { data: trendsData } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: () => api.ml.marketTrends(10),
    enabled: tab === 'ml',
  })

  const toggleUserMutation = useMutation({
    mutationFn: (id: number) => api.admin.toggleUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const toggleJobMutation = useMutation({
    mutationFn: (id: number) => api.admin.toggleJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }),
  })

  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => api.admin.deleteJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }),
  })

  const stats      = statsData?.data
  const users      = (usersData?.data ?? []) as User[]
  const usersPagination = usersData?.pagination
  const jobs       = (jobsData?.data ?? []) as JobPosting[]
  const jobsPagination  = jobsData?.pagination
  const trends     = trendsData?.data

  const skillChartData = trends
    ? Object.entries(trends.top_skills).map(([skill, count]) => ({ skill, count }))
    : []

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users',    label: 'Users' },
    { key: 'jobs',     label: 'Jobs' },
    { key: 'ml',       label: 'ML Analytics' },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform management and analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#1a3a5c] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users',       value: stats?.total_users,       sub: `${stats?.total_students ?? 0} students · ${stats?.total_employers ?? 0} employers` },
                { label: 'Active Jobs',       value: stats?.active_jobs,       sub: `${stats?.total_jobs ?? 0} total postings` },
                { label: 'Applications',      value: stats?.total_applications, sub: 'all time' },
                { label: 'Job Categories',    value: stats?.total_categories,  sub: 'distinct categories' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-[#1a3a5c] mt-1">{card.value ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Platform at a glance</h2>
              <p className="text-sm text-gray-500">
                Switch to the <strong>Users</strong> or <strong>Jobs</strong> tab to manage the platform.
                Use <strong>ML Analytics</strong> to view market trends.
              </p>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                placeholder="Search by name or email..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
              <select
                value={userRole}
                onChange={e => { setUserRole(e.target.value); setUserPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              >
                <option value="">All roles</option>
                <option value="student">Students</option>
                <option value="employer">Employers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-14" />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
                        <td className="px-5 py-3 text-gray-500">{user.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => toggleUserMutation.mutate(user.id)}
                            disabled={toggleUserMutation.isPending}
                            className={`text-xs font-medium hover:underline disabled:opacity-50 ${user.is_active ? 'text-red-500' : 'text-green-600'}`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {usersPagination && usersPagination.last_page > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button onClick={() => setUserPage(p => p - 1)} disabled={userPage <= 1}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {usersPagination.current_page} of {usersPagination.last_page}</span>
                <button onClick={() => setUserPage(p => p + 1)} disabled={userPage >= usersPagination.last_page}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Jobs ── */}
        {tab === 'jobs' && (
          <div>
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                value={jobSearch}
                onChange={e => { setJobSearch(e.target.value); setJobPage(1) }}
                placeholder="Search jobs..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
              <select
                value={jobStatus}
                onChange={e => { setJobStatus(e.target.value); setJobPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              >
                <option value="">All jobs</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            {jobsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-14" />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobs.map(job => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{job.title}</td>
                        <td className="px-5 py-3 text-gray-500">{job.employer?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-500">{job.category ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleJobMutation.mutate(job.id)}
                            disabled={toggleJobMutation.isPending}
                            className={`text-xs font-medium hover:underline disabled:opacity-50 ${job.is_active ? 'text-yellow-600' : 'text-green-600'}`}
                          >
                            {job.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this job permanently?')) deleteJobMutation.mutate(job.id) }}
                            disabled={deleteJobMutation.isPending}
                            className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {jobsPagination && jobsPagination.last_page > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button onClick={() => setJobPage(p => p - 1)} disabled={jobPage <= 1}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {jobsPagination.current_page} of {jobsPagination.last_page}</span>
                <button onClick={() => setJobPage(p => p + 1)} disabled={jobPage >= jobsPagination.last_page}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ML Analytics ── */}
        {tab === 'ml' && (
          <div className="space-y-6">
            {/* Top skills chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Top In-Demand Skills</h2>
              {skillChartData.length === 0 ? (
                <p className="text-sm text-gray-400">No skill data yet — post jobs with required skills.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={skillChartData} margin={{ top: 0, right: 0, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1a3a5c" radius={[4, 4, 0, 0]} name="Job postings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Salary by category */}
            {trends && trends.salary_by_category.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Average Salary by Category</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={trends.salary_by_category} margin={{ top: 0, right: 0, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toLocaleString()}` : v} />
                    <Bar dataKey="avg_min" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Avg min salary" />
                    <Bar dataKey="avg_max" fill="#1a3a5c" radius={[4, 4, 0, 0]} name="Avg max salary" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category trends table */}
            {trends && trends.category_trends.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Category Trend (EWMA)</h2>
                <div className="space-y-3">
                  {trends.category_trends.map(t => (
                    <div key={t.category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t.category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-[#1a3a5c] h-2 rounded-full"
                            style={{ width: `${Math.min(100, (t.ewma / (trends.category_trends[0]?.ewma || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{t.ewma.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
