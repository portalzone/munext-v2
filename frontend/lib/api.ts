// All API calls to the Laravel backend go here.
// Never call fetch() directly from a component — always go through this file.

import { AuthResponse } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
}
