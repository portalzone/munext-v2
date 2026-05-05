// All TypeScript interfaces for API responses go here.
// No `any` type allowed — if the shape is unknown, define it.

export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'alumni' | 'employer' | 'admin'
  is_active: boolean
  banned_at: string | null
  ban_reason: string | null
  employer_approved: boolean
}

export interface AuditLog {
  id: number
  log_name: string | null
  description: string
  subject_type: string | null
  subject_id: number | null
  causer_type: string | null
  causer_id: number | null
  properties: Record<string, unknown>
  created_at: string
  causer?: Pick<User, 'id' | 'name' | 'email'> | null
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

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship'

export interface JobPosting {
  id: number
  employer_id: number
  title: string
  description: string
  skills_required: string[]
  experience_level: 'entry' | 'mid' | 'senior'
  category: string | null
  job_type: JobType | null
  location: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  employer?: Pick<User, 'id' | 'name' | 'email'>
  employer_profile?: {
    company_name: string
    industry: string | null
    website: string | null
    location: string | null
    description: string | null
  } | null
}

export interface JobFilters {
  search?: string
  category?: string
  job_type?: string
  experience_level?: string
  location?: string
  is_remote?: boolean
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
  unread_messages_count?: number
  student?: Pick<User, 'id' | 'name' | 'email'>
  job?: Pick<JobPosting, 'id' | 'title' | 'experience_level'>
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

export interface Message {
  id: number
  application_id: number
  sender_id: number
  body: string
  attachment_path: string | null
  attachment_name: string | null
  attachment_url: string | null
  read_at: string | null
  created_at: string
  updated_at: string
  sender?: Pick<User, 'id' | 'name' | 'role'>
}

export interface ThreadResponse {
  data: Message[]
  application: { id: number; status: Application['status']; student_id: number; job_id: number }
  message: string
  status: number
}

export interface EmployerProfile {
  id: number
  user_id: number
  company_name: string
  industry: string | null
  website: string | null
  location: string | null
  description: string | null
  created_at: string
  updated_at: string
  user?: Pick<User, 'id' | 'name' | 'email'>
}

// ML types

export interface JobRecommendation {
  score: number
  job: JobPosting
}

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

export interface SkillDemand {
  skill: string
  count: number
  trend: 'up' | 'down' | 'stable'
  computed_at: string
}

export interface HiringTrend {
  month: string
  job_count: number
  application_count: number
  computed_at: string
}

export interface SalaryBucket {
  salary_range: string
  job_count: number
}

export interface TopEmployer {
  company_name: string
  industry: string | null
  job_count: number
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
