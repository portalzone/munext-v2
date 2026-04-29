// All API calls to the Laravel backend go here.
// Never call fetch() directly from a component — always go through this file.

import { AuthResponse, ApiResponse, JobPosting, StudentProfile } from './types'

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
  },

  jobs: {
    list: () =>
      request<ApiResponse<JobPosting[]>>('/jobs'),

    get: (id: number) =>
      request<ApiResponse<JobPosting>>(`/jobs/${id}`),
  },

  students: {
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
  },
}
