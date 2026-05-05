'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie,
} from 'recharts'

const TREND_COLOR: Record<string, string> = {
  up:     '#22c55e',
  down:   '#ef4444',
  stable: '#94a3b8',
}

const PIE_COLORS = ['#1a3a5c', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe']

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Skeleton() {
  return <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
}

export default function AnalyticsPage() {
  const skills    = useQuery({ queryKey: ['analytics-skills'],   queryFn: () => api.analytics.skillsDemand() })
  const trends    = useQuery({ queryKey: ['analytics-trends'],   queryFn: () => api.analytics.hiringTrends() })
  const salary    = useQuery({ queryKey: ['analytics-salary'],   queryFn: () => api.analytics.salaryDistribution() })
  const employers = useQuery({ queryKey: ['analytics-employers'],queryFn: () => api.analytics.topEmployers() })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Market Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Powered by daily Spark pipeline · Updated every 24 hours</p>
        </div>

        <div className="grid gap-6">

          {/* Skills Demand */}
          <SectionCard title="Top Skills in Demand">
            {skills.isLoading && <Skeleton />}
            {skills.isError  && <p className="text-sm text-red-500">Failed to load skills data.</p>}
            {skills.data && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={skills.data.data} margin={{ top: 0, right: 0, left: -20, bottom: 60 }}>
                  <XAxis
                    dataKey="skill"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, _name, props) => [value, `Trend: ${props.payload.trend}`]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {skills.data.data.map((entry, i) => (
                      <Cell key={i} fill={TREND_COLOR[entry.trend] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Trending up</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Trending down</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" /> Stable</span>
            </div>
          </SectionCard>

          {/* Hiring Trends */}
          <SectionCard title="Monthly Hiring Trends">
            {trends.isLoading && <Skeleton />}
            {trends.isError  && <p className="text-sm text-red-500">Failed to load hiring trends.</p>}
            {trends.data && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trends.data.data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="job_count"
                    name="Jobs Posted"
                    stroke="#1a3a5c"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="application_count"
                    name="Applications"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Salary Distribution + Top Employers side by side on wider screens */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Salary Distribution */}
            <SectionCard title="Salary Distribution">
              {salary.isLoading && <Skeleton />}
              {salary.isError  && <p className="text-sm text-red-500">Failed to load salary data.</p>}
              {salary.data && (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={salary.data.data}
                        dataKey="job_count"
                        nameKey="salary_range"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {salary.data.data.map((_entry, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} jobs`]} contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-3 space-y-1.5">
                    {salary.data.data.map((row, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {row.salary_range}
                        </span>
                        <span className="font-medium">{row.job_count} jobs</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </SectionCard>

            {/* Top Employers */}
            <SectionCard title="Top Employers by Active Jobs">
              {employers.isLoading && <Skeleton />}
              {employers.isError  && <p className="text-sm text-red-500">Failed to load employer data.</p>}
              {employers.data && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    layout="vertical"
                    data={employers.data.data}
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="company_name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(value, _name, props) => [
                        `${value} jobs`,
                        props.payload.industry ?? 'Unknown industry',
                      ]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="job_count" name="Active Jobs" fill="#1a3a5c" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

          </div>
        </div>
      </div>
    </main>
  )
}
