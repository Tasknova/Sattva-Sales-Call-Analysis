import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lsuuivbaemjqmtztrjqq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXVpdmJhZW1qcW10enRyanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTUzMjMsImV4cCI6MjA3MzA3MTMyM30.0geG3EgNNZ5wH2ClKzZ_lwUgJlHRXr1CxcXo80ehVGM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface Recording {
  id: string
  user_id: string
  lead_id?: string
  call_history_id?: string
  file_name?: string
  recording_url?: string
  status?: 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'failed' | 'queued' | 'pending' | 'uploaded'
  duration_seconds?: number
  transcript?: string
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  recording_id?: string
  user_id: string
  participants_count?: number
  participants_names?: string // Changed from array to text
  closure_probability?: number
  closure_probability_reasoning?: string
  recruiter_process_score?: number
  candidate_acceptance_risk?: string
  candidate_acceptance_risk_reasoning?: string
  recruiter_confidence_score?: number
  purpose_of_call?: string
  exec_summary?: string
  next_steps?: string
  ai_feedback_for_recruiter?: string
  outcome?: string
  objections_detected?: string // Changed from array to text
  objections_handeled?: string // Changed from array to text (keeping typo for backwards compatibility)
  additional_details?: any // JSONB
  follow_up_details?: string
  objections_raised?: string // Changed from array to text
  objections_handled?: string // Changed from array to text
  created_at: string
  recordings?: {
    id: string
    file_name?: string
    recording_url?: string
    status?: 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'failed' | 'queued' | 'pending' | 'uploaded'
    call_history_id?: string
  }
}

export interface MetricsAggregate {
  id: string
  user_id: string
  date: string
  total_calls?: number
  avg_sentiment?: number
  avg_engagement?: number
  conversion_rate?: number
  objections_rate?: number
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  company_email?: string
  company_industry?: string
  position?: string
  use_cases?: string[]
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface LeadGroup {
  id: string
  user_id: string
  group_name: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  user_id: string // The manager who owns/created this lead
  name: string
  email: string
  contact: string
  description?: string
  other?: any // JSON object for additional fields
  group_id?: string
  client_id?: string // Reference to the client
  job_id?: string // Reference to the job this candidate is being considered for
  assigned_to?: string // Reference to the employee assigned to work on this lead (by the manager)
  status?: 'contacted' | 'follow_up' | 'converted' | 'completed' | 'not_interested' | 'removed' // Lead status
  created_at: string
  updated_at: string
  lead_groups?: LeadGroup // Joined data
  clients?: Client // Joined data
  jobs?: Job // Joined data
}

export interface Client {
  id: string
  company_id: string
  name: string
  industry?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  company_id: string
  client_id: string
  title: string
  description?: string
  location?: string
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary'
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive'
  salary_range?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  status: 'open' | 'closed' | 'on-hold' | 'filled'
  positions_available: number
  posted_by?: string
  is_active: boolean
  created_at: string
  updated_at: string
  clients?: Client // Joined data
}

export interface ManagerClientAssignment {
  id: string
  manager_id: string
  client_id: string
  assigned_by?: string
  assigned_at: string
  is_active: boolean
  created_at: string
  clients?: Client // Joined data
}