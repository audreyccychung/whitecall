// User types
export interface User {
  id: string
  email: string
  display_name?: string
  profession?: string
  timezone?: string
  avatar_url?: string
  created_at: Date
}

// Profile types (V0 schema from WHITECALL.md)
export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_type: string // 'penguin', 'bear', 'cat', 'dog', 'rabbit', etc.
  avatar_color?: string
  is_on_call: boolean
  current_streak: number
  longest_streak: number
  last_heart_sent_date?: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

// Auth context types
export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}

// Shift template types
export interface ShiftTemplate {
  id: string
  user_id: string
  name: string
  color: string
  default_start_time: string
  default_duration_hours: number
  created_at: Date
}

// Shift types
export interface Shift {
  id: string
  user_id: string
  template_id: string
  start_datetime: Date
  end_datetime: Date
  notes?: string
  created_at: Date
}

// Group types
export interface Group {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: Date
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: Date
}

// UI State types
export type ShiftStatus = 'upcoming' | 'active' | 'completed'

// Common types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
