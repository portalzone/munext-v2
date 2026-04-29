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

export interface JobPosting {
  id: number
  employer_id: number
  title: string
  description: string
  skills_required: string[]
  experience_level: 'entry' | 'mid' | 'senior'
  created_at: string
  updated_at: string
  employer?: Pick<User, 'id' | 'name' | 'email'>
}

export interface StudentProfile {
  id: number
  user_id: number
  program: string
  gpa: number | null
  graduation_year: number
  skills: string[]
  created_at: string
  updated_at: string
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}
