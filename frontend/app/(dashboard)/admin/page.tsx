'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import { User, JobPosting, AuditLog } from '@/lib/types'

const ROLE_COLORS: Record<User['role'], string> = {
  student:  'bg-blue-100 text-blue-700',
  alumni:   'bg-green-100 text-green-700',
  employer: 'bg-purple-100 text-purple-700',
  admin:    'bg-gray-100 text-gray-700',
}

type AdminTab = 'overview' | 'users' | 'jobs' | 'ml' | 'audit'

function Pagination({
  current, last, onPrev, onNext,
}: { current: number; last: number; onPrev: () => void; onNext: () => void }) {
  if (last <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button onClick={onPrev} disabled={current <= 1}
        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
        Previous
      </button>
      <span className="text-sm text-gray-500">Page {current} of {last}</span>
      <button onClick={onNext} disabled={current >= last}
        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
        Next
      </button>
    </div>
  )
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<AdminTab>('overview')

  // Users state
  const [userSearch, setUserSearch] = useState('')
  const [userRole,   setUserRole]   = useState('')
  const [userPage,   setUserPage]   = useState(1)
  const [banTarget,  setBanTarget]  = useState<User | null>(null)
  const [banReason,  setBanReason]  = useState('')

  // Jobs state
  const [jobSearch, setJobSearch] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const [jobPage,   setJobPage]   = useState(1)

  // Audit state
  const [auditPage, setAuditPage] = useState(1)

  // ── Queries ─────────────────────────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => api.admin.stats(),
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userSearch, userRole, userPage],
    queryFn:  () => api.admin.users({ search: userSearch || undefined, role: userRole || undefined, page: userPage }),
    enabled:  tab === 'users',
  })

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs', jobSearch, jobStatus, jobPage],
    queryFn:  () => api.admin.jobs({ search: jobSearch || undefined, status: jobStatus || undefined, page: jobPage }),
    enabled:  tab === 'jobs',
  })

  const { data: trendsData } = useQuery({
    queryKey: ['admin-trends'],
    queryFn:  () => api.ml.marketTrends(10),
    enabled:  tab === 'ml',
  })

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit', auditPage],
    queryFn:  () => api.admin.auditLog({ page: auditPage, per_page: 20 }),
    enabled:  tab === 'audit',
  })

  // ── Mutations ────────────────────────────────────────────────────────
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const toggleUserMutation    = useMutation({ mutationFn: (id: number) => api.admin.toggleUser(id),    onSuccess: invalidateUsers })
  const promoteMutation       = useMutation({ mutationFn: (id: number) => api.admin.promoteToAdmin(id), onSuccess: invalidateUsers })
  const banMutation           = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.admin.banUser(id, reason || undefined),
    onSuccess:  () => { invalidateUsers(); setBanTarget(null); setBanReason('') },
  })
  const unbanMutation         = useMutation({ mutationFn: (id: number) => api.admin.unbanUser(id),      onSuccess: invalidateUsers })
  const approveEmployerMutation = useMutation({ mutationFn: (id: number) => api.admin.approveEmployer(id), onSuccess: invalidateUsers })

  const toggleJobMutation  = useMutation({ mutationFn: (id: number) => api.admin.toggleJob(id),  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }) })
  const deleteJobMutation  = useMutation({ mutationFn: (id: number) => api.admin.deleteJob(id),  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }) })

  // ── Derived data ─────────────────────────────────────────────────────
  const stats          = statsData?.data
  const users          = (usersData?.data ?? []) as User[]
  const usersPagination = usersData?.pagination
  const jobs           = (jobsData?.data ?? []) as JobPosting[]
  const jobsPagination  = jobsData?.pagination
  const trends         = trendsData?.data
  const auditLogs      = (auditData?.data ?? []) as AuditLog[]
  const auditPagination = auditData?.pagination

  const skillChartData = trends
    ? Object.entries(trends.top_skills).map(([skill, count]) => ({ skill, count }))
    : []

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'overview', label: 'Overview'   },
    { key: 'users',    label: 'Users'      },
    { key: 'jobs',     label: 'Jobs'       },
    { key: 'ml',       label: 'ML Analytics' },
    { key: 'audit',    label: 'Audit Trail' },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform management and analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#1a3a5c] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Users',    value: stats?.total_users,        sub: `${stats?.total_students ?? 0} students · ${stats?.total_employers ?? 0} employers` },
                { label: 'Active Jobs',    value: stats?.active_jobs,        sub: `${stats?.total_jobs ?? 0} total postings` },
                { label: 'Applications',   value: stats?.total_applications, sub: 'all time' },
                { label: 'Job Categories', value: stats?.total_categories,   sub: 'distinct categories' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-[#1a3a5c] mt-1">{card.value ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-sm text-gray-500 leading-relaxed">
              Use the <strong className="text-gray-700">Users</strong> tab to manage accounts, approve employers, and ban bad actors.
              Use <strong className="text-gray-700">Jobs</strong> to moderate postings.
              Use <strong className="text-gray-700">Audit Trail</strong> to review all admin actions.
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div>
            {/* Ban modal */}
            {banTarget && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Ban {banTarget.name}?</h3>
                  <p className="text-sm text-gray-500 mb-4">The user will be immediately signed out and blocked from logging in.</p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="e.g. Spam, fraudulent posting"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => banMutation.mutate({ id: banTarget.id, reason: banReason })}
                      disabled={banMutation.isPending}
                      className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                    >
                      {banMutation.isPending ? 'Banning…' : 'Confirm Ban'}
                    </button>
                    <button onClick={() => setBanTarget(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-5">
              <input type="text" value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                placeholder="Search by name or email..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
              <select value={userRole} onChange={e => { setUserRole(e.target.value); setUserPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]">
                <option value="">All roles</option>
                <option value="student">Students</option>
                <option value="alumni">Alumni</option>
                <option value="employer">Employers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-14" />)}</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <span className={`block text-xs font-medium px-2 py-0.5 rounded-full w-fit ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.banned_at && (
                            <span className="block text-xs font-medium px-2 py-0.5 rounded-full w-fit bg-red-800 text-white">
                              Banned
                            </span>
                          )}
                          {user.role === 'employer' && (
                            <span className={`block text-xs font-medium px-2 py-0.5 rounded-full w-fit ${user.employer_approved ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {user.employer_approved ? 'Approved' : 'Pending approval'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {/* Activate / Deactivate */}
                            <button onClick={() => toggleUserMutation.mutate(user.id)} disabled={toggleUserMutation.isPending}
                              className={`text-xs font-medium hover:underline disabled:opacity-50 ${user.is_active ? 'text-orange-500' : 'text-green-600'}`}>
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Ban / Unban */}
                            {user.banned_at ? (
                              <button onClick={() => unbanMutation.mutate(user.id)} disabled={unbanMutation.isPending}
                                className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50">
                                Unban
                              </button>
                            ) : (
                              <button onClick={() => { setBanTarget(user); setBanReason('') }}
                                className="text-xs font-medium text-red-500 hover:underline">
                                Ban
                              </button>
                            )}

                            {/* Promote to admin */}
                            {user.role !== 'admin' && (
                              <button onClick={() => { if (confirm(`Promote ${user.name} to admin?`)) promoteMutation.mutate(user.id) }}
                                disabled={promoteMutation.isPending}
                                className="text-xs font-medium text-purple-600 hover:underline disabled:opacity-50">
                                Make Admin
                              </button>
                            )}

                            {/* Approve employer */}
                            {user.role === 'employer' && (
                              <button onClick={() => approveEmployerMutation.mutate(user.id)} disabled={approveEmployerMutation.isPending}
                                className={`text-xs font-medium hover:underline disabled:opacity-50 ${user.employer_approved ? 'text-yellow-600' : 'text-blue-600'}`}>
                                {user.employer_approved ? 'Revoke Approval' : 'Approve'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              current={userPage} last={usersPagination?.last_page ?? 1}
              onPrev={() => setUserPage(p => p - 1)} onNext={() => setUserPage(p => p + 1)}
            />
          </div>
        )}

        {/* ── Jobs ── */}
        {tab === 'jobs' && (
          <div>
            <div className="flex gap-3 mb-5">
              <input type="text" value={jobSearch}
                onChange={e => { setJobSearch(e.target.value); setJobPage(1) }}
                placeholder="Search jobs..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
              <select value={jobStatus} onChange={e => { setJobStatus(e.target.value); setJobPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]">
                <option value="">All jobs</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            {jobsLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-14" />)}</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobs.map(job => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                        <td className="px-4 py-3 text-gray-500">{job.employer?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{job.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                          <button onClick={() => toggleJobMutation.mutate(job.id)} disabled={toggleJobMutation.isPending}
                            className={`text-xs font-medium hover:underline disabled:opacity-50 ${job.is_active ? 'text-yellow-600' : 'text-green-600'}`}>
                            {job.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => { if (confirm('Delete this job permanently?')) deleteJobMutation.mutate(job.id) }}
                            disabled={deleteJobMutation.isPending}
                            className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              current={jobPage} last={jobsPagination?.last_page ?? 1}
              onPrev={() => setJobPage(p => p - 1)} onNext={() => setJobPage(p => p + 1)}
            />
          </div>
        )}

        {/* ── ML Analytics ── */}
        {tab === 'ml' && (
          <div className="space-y-6">
            {/* Algorithm cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { alg: 'Alg 1', title: 'Skill Match',        desc: 'Jaccard similarity between student skills and job requirements. Shown on every job detail and applicant card.', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { alg: 'Alg 2', title: 'Profile Strength',    desc: 'Weighted score (completeness 30%, skills 25%, resume 20%, activity 25%) shown on student profile pages.', color: 'bg-green-50 text-green-700 border-green-100' },
                { alg: 'Alg 3', title: 'Hiring Funnel',       desc: 'Per-job conversion rates (applied → reviewed → shortlisted → hired) shown on each employer dashboard.', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                { alg: 'Alg 4', title: 'Success Predictor',   desc: 'Weighted probability (skill match 35%, profile 25%, employer selectivity 40%) shown on job detail pages.', color: 'bg-purple-50 text-purple-700 border-purple-100' },
              ].map(({ alg, title, desc, color }) => (
                <div key={alg} className={`rounded-xl border p-4 ${color.split(' ').slice(2).join(' ')} bg-opacity-50`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{alg}</span>
                  <p className="text-sm font-semibold text-gray-900 mt-2 mb-1">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Algorithm 5 — Market Trends */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">Alg 5</span>
                <h2 className="text-base font-semibold text-gray-900">Market Trends — Top In-Demand Skills</h2>
              </div>
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

            {trends && trends.salary_by_category.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Average Salary by Category</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={trends.salary_by_category} margin={{ top: 0, right: 0, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toLocaleString()}` : v} />
                    <Bar dataKey="avg_min" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Avg min salary" />
                    <Bar dataKey="avg_max" fill="#1a3a5c" radius={[4, 4, 0, 0]} name="Avg max salary" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {trends && trends.category_trends.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Category Trend (EWMA Smoothing)</h2>
                <div className="space-y-3">
                  {trends.category_trends.map(t => (
                    <div key={t.category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t.category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="bg-[#1a3a5c] h-2 rounded-full"
                            style={{ width: `${Math.min(100, (t.ewma / (trends.category_trends[0]?.ewma || 1)) * 100)}%` }} />
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

        {/* ── Audit Trail ── */}
        {tab === 'audit' && (
          <div>
            <p className="text-sm text-gray-500 mb-5">All admin and system actions, most recent first.</p>

            {auditLoading ? (
              <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-14" />)}</div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">No audit entries yet.</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Performed by</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{log.description}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {log.causer ? `${log.causer.name}` : <span className="text-gray-300 italic">system</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {log.subject_type
                            ? `${log.subject_type.split('\\').pop()} #${log.subject_id}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              current={auditPage} last={auditPagination?.last_page ?? 1}
              onPrev={() => setAuditPage(p => p - 1)} onNext={() => setAuditPage(p => p + 1)}
            />
          </div>
        )}

      </div>
    </main>
  )
}
