// All TypeScript interfaces for API responses go here.
// No `any` type allowed — if the shape is unknown, define it.

export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'employer' | 'admin'
}

export interface AuthResponse {
  data: {
    user: User
    token: string
  }
  message: string
  status: number
}

export interface ApiError {
  error: string
  message: string
  status: number
}
