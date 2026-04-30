// All TypeScript interfaces for API responses go here.
// No `any` type allowed — if the shape is unknown, define it.

export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'employer' | 'admin'
  is_active: boolean
}

export interface PlatformStats {
  total_users: number
  total_students: number
  total_employers: number
  active_jobs: number
  total_jobs: number
  total_applications: number
  total_categories: number
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

export interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface JobPosting {
  id: number
  employer_id: number
  title: string
  description: string
  skills_required: string[]
  experience_level: 'entry' | 'mid' | 'senior'
  category: string | null
  salary_min: number | null
  salary_max: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  employer?: Pick<User, 'id' | 'name' | 'email'>
}

export interface JobFilters {
  search?: string
  category?: string
  experience_level?: string
  salary_min?: number
  salary_max?: number
  sort?: 'newest' | 'oldest' | 'salary_high' | 'salary_low'
  page?: number
  per_page?: number
}

export interface JobListResponse {
  data: JobPosting[]
  pagination: Pagination
  message: string
  status: number
}

export interface Application {
  id: number
  student_id: number
  job_id: number
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  cover_letter: string | null
  applied_at: string | null
  created_at: string
  updated_at: string
  student?: Pick<User, 'id' | 'name' | 'email'>
  job?: Pick<JobPosting, 'id' | 'title'>
}

export interface StudentProfile {
  id: number
  user_id: number
  program: string
  gpa: number | null
  graduation_year: number
  skills: string[]
  resume_path: string | null
  created_at: string
  updated_at: string
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface BookmarkStatus {
  bookmarked: boolean
}

export interface AppNotification {
  id: number
  user_id: number
  type: string
  message: string
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationsResponse {
  data: AppNotification[]
  unread_count: number
  message: string
  status: number
}

// ML types

export interface SkillMatch {
  score: number
  matched_skills: string[]
  missing_skills: string[]
  extra_skills: string[]
}

export interface ProfileStrength {
  score: number
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent'
  breakdown: {
    completeness: number
    skills: number
    resume: number
    activity: number
  }
}

export interface SuccessPredictor {
  probability: number
  confidence: 'Low' | 'Medium' | 'High'
  factors: {
    skill_match: number
    profile: number
    selectivity: number
  }
  suggestions: string[]
}

export interface FunnelStage {
  job_id: number
  job_title: string
  stages: {
    applied: number
    reviewed: number
    shortlisted: number
    hired: number
  }
  conversion_rates: {
    to_reviewed: number
    to_shortlisted: number
    to_hired: number
  }
}

export interface MarketTrends {
  top_skills: Record<string, number>
  salary_by_category: {
    category: string
    avg_min: number
    avg_max: number
    job_count: number
  }[]
  category_trends: {
    category: string
    ewma: number
    weeks: { week: string; count: number }[]
  }[]
}
