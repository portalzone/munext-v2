// All API calls to the Laravel backend go here.
// Never call fetch() directly from a component — always go through this file.

import {
  AuthResponse,
  ApiResponse,
  JobPosting,
  JobListResponse,
  JobFilters,
  Application,
  StudentProfile,
  EmployerProfile,
  User,
  PlatformStats,
  SkillMatch,
  JobRecommendation,
  ProfileStrength,
  SuccessPredictor,
  FunnelStage,
  MarketTrends,
  BookmarkStatus,
  NotificationsResponse,
  Message,
  ThreadResponse,
  AuditLog,
  Pagination,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  const json = await res.json()

  if (!res.ok) {
    throw json
  }

  return json as T
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return query ? `?${query}` : ''
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; role: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () =>
      request<ApiResponse<User>>('/auth/me'),

    logout: () =>
      request<ApiResponse<null>>('/auth/logout', { method: 'POST' }),

    forgotPassword: (email: string) =>
      request<ApiResponse<null>>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      request<ApiResponse<null>>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  jobs: {
    list: (filters?: JobFilters) =>
      request<JobListResponse>(`/jobs${buildQuery({ ...filters } as Record<string, string | number | boolean | undefined>)}`),

    myJobs: (params?: { sort?: string; page?: number; per_page?: number }) =>
      request<JobListResponse>(`/jobs/my-jobs${buildQuery({ ...params } as Record<string, string | number | boolean | undefined>)}`),

    get: (id: number) =>
      request<ApiResponse<JobPosting>>(`/jobs/${id}`),

    create: (data: Omit<JobPosting, 'id' | 'employer_id' | 'created_at' | 'updated_at' | 'employer'>) =>
      request<ApiResponse<JobPosting>>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<Omit<JobPosting, 'id' | 'employer_id' | 'created_at' | 'updated_at' | 'employer'>>) =>
      request<ApiResponse<JobPosting>>(`/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<ApiResponse<null>>(`/jobs/${id}`, { method: 'DELETE' }),

    match: (id: number) =>
      request<ApiResponse<SkillMatch>>(`/jobs/${id}/match`),

    apply: (id: number, coverLetter: string) =>
      request<ApiResponse<Application>>(`/jobs/${id}/apply`, {
        method: 'POST',
        body: JSON.stringify({ cover_letter: coverLetter }),
      }),

    applicants: (jobId: number) =>
      request<ApiResponse<Application[]>>(`/jobs/${jobId}/applicants`),

    updateStatus: (jobId: number, applicationId: number, status: Application['status']) =>
      request<ApiResponse<Application>>(`/jobs/${jobId}/applicants/${applicationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    myApplications: () =>
      request<ApiResponse<Application[]>>('/jobs/my-applications'),

    bookmarks: () =>
      request<ApiResponse<JobPosting[]>>('/jobs/bookmarks'),

    bookmarkStatus: (id: number) =>
      request<ApiResponse<BookmarkStatus>>(`/jobs/${id}/bookmark`),

    toggleBookmark: (id: number) =>
      request<ApiResponse<BookmarkStatus>>(`/jobs/${id}/bookmark`, { method: 'POST' }),
  },

  students: {
    myProfile: () =>
      request<ApiResponse<StudentProfile | null>>('/students/my-profile'),

    list: () =>
      request<ApiResponse<StudentProfile[]>>('/students'),

    get: (id: number) =>
      request<ApiResponse<StudentProfile>>(`/students/${id}`),

    createProfile: (data: Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'user'>) =>
      request<ApiResponse<StudentProfile>>('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateProfile: (id: number, data: Partial<Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'user'>>) =>
      request<ApiResponse<StudentProfile>>(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    uploadResume: (file: File) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const form = new FormData()
      form.append('resume', file)
      return fetch(`${API_BASE}/students/resume`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      }).then(async res => {
        const json = await res.json()
        if (!res.ok) throw json
        return json as ApiResponse<{ resume_path: string; resume_url: string }>
      })
    },
  },

  admin: {
    stats: () =>
      request<ApiResponse<PlatformStats>>('/admin/stats'),

    users: (params?: { role?: string; search?: string; page?: number }) =>
      request<JobListResponse & { data: User[] }>(`/admin/users${buildQuery({ ...params } as Record<string, string | number | undefined>)}`),

    toggleUser: (id: number) =>
      request<ApiResponse<User>>(`/admin/users/${id}/toggle`, { method: 'PUT' }),

    promoteToAdmin: (id: number) =>
      request<ApiResponse<User>>(`/admin/users/${id}/promote`, { method: 'PUT' }),

    banUser: (id: number, reason?: string) =>
      request<ApiResponse<User>>(`/admin/users/${id}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),

    unbanUser: (id: number) =>
      request<ApiResponse<User>>(`/admin/users/${id}/unban`, { method: 'PUT' }),

    approveEmployer: (id: number) =>
      request<ApiResponse<User>>(`/admin/users/${id}/approve-employer`, { method: 'PUT' }),

    auditLog: (params?: { page?: number; per_page?: number }) =>
      request<{ data: AuditLog[]; pagination: Pagination; message: string; status: number }>(
        `/admin/audit-log${buildQuery({ ...params } as Record<string, string | number | undefined>)}`
      ),

    jobs: (params?: { search?: string; status?: string; page?: number }) =>
      request<JobListResponse>(`/admin/jobs${buildQuery({ ...params } as Record<string, string | number | undefined>)}`),

    toggleJob: (id: number) =>
      request<ApiResponse<JobPosting>>(`/admin/jobs/${id}/toggle`, { method: 'PUT' }),

    deleteJob: (id: number) =>
      request<ApiResponse<null>>(`/admin/jobs/${id}`, { method: 'DELETE' }),
  },

  employer: {
    getProfile: () =>
      request<ApiResponse<EmployerProfile | null>>('/employer/profile'),

    createProfile: (data: Pick<EmployerProfile, 'company_name' | 'industry' | 'website' | 'location' | 'description'>) =>
      request<ApiResponse<EmployerProfile>>('/employer/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateProfile: (data: Partial<Pick<EmployerProfile, 'company_name' | 'industry' | 'website' | 'location' | 'description'>>) =>
      request<ApiResponse<EmployerProfile>>('/employer/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  notifications: {
    list: () =>
      request<NotificationsResponse>('/notifications'),

    markRead: (id: number) =>
      request<ApiResponse<null>>(`/notifications/${id}/read`, { method: 'PUT' }),

    markAllRead: () =>
      request<ApiResponse<null>>('/notifications/read-all', { method: 'PUT' }),
  },

  messages: {
    thread: (applicationId: number) =>
      request<ThreadResponse>(`/messages/${applicationId}`),

    send: (applicationId: number, body: string, attachment?: File) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const form  = new FormData()
      form.append('body', body)
      if (attachment) form.append('attachment', attachment)
      return fetch(`${API_BASE}/messages/${applicationId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      }).then(async res => {
        const json = await res.json()
        if (!res.ok) throw json
        return json as ApiResponse<Message>
      })
    },

    unreadCount: () =>
      request<ApiResponse<{ unread_count: number }>>('/messages/unread-count'),

    broadcast: (jobId: number, body: string) =>
      request<ApiResponse<{ sent_to: number }>>(`/messages/broadcast/${jobId}`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
  },

  contact: {
    send: (data: { name: string; email: string; subject: string; message: string }) =>
      request<{ message: string; status: number }>('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  ml: {
    skillMatch: (jobId: number) =>
      request<ApiResponse<SkillMatch>>(`/ml/match/${jobId}`),

    applicantMatch: (jobId: number, studentId: number) =>
      request<ApiResponse<SkillMatch>>(`/ml/match/${jobId}/applicant/${studentId}`),

    jobRecommendations: (top?: number) =>
      request<ApiResponse<JobRecommendation[]>>(`/ml/recommendations${top ? `?top=${top}` : ''}`),

    profileStrength: () =>
      request<ApiResponse<ProfileStrength>>('/ml/profile-strength'),

    successPredictor: (jobId: number) =>
      request<ApiResponse<SuccessPredictor>>(`/ml/predict/${jobId}`),

    hiringFunnel: () =>
      request<ApiResponse<{ jobs: FunnelStage[] }>>('/ml/funnel'),

    marketTrends: (topN?: number) =>
      request<ApiResponse<MarketTrends>>(`/ml/trends${topN ? `?top=${topN}` : ''}`),
  },
}
