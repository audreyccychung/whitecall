// Database types matching Supabase schema

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  // Streak tracking (auto-updated by DB trigger on heart send)
  current_streak: number;
  longest_streak: number;
  last_heart_sent_date: string | null; // YYYY-MM-DD format
  // Privacy settings
  share_data_with_groups: boolean;
  // Onboarding
  onboarding_completed: boolean;
  // Metadata
  created_at: string;
  updated_at: string;
}

// Call rating types
export type CallRatingValue = 'rough' | 'okay' | 'good' | 'great';

export interface CallRating {
  id: string;
  user_id: string;
  call_date: string; // YYYY-MM-DD format
  rating: CallRatingValue;
  notes: string | null;
  hours_slept: number | null; // 0-12 in 0.5hr increments
  created_at: string;
  updated_at: string;
}

// Rating display helpers
// Grayscale gradient: black (worst) → dark gray → light gray → white (best)
export const RATING_EMOJI: Record<CallRatingValue, string> = {
  rough: '⚫',  // Black call
  okay: '⚫',   // Dark gray (will be rendered as CSS circle)
  good: '⚪',   // Light gray (will be rendered as CSS circle)
  great: '⚪',  // White call
};

// CSS colors for rendering circles (grayscale gradient)
export const RATING_COLORS: Record<CallRatingValue, string> = {
  rough: '#1f2937', // gray-800 (black)
  okay: '#6b7280',  // gray-500 (dark gray)
  good: '#d1d5db',  // gray-300 (light gray)
  great: '#ffffff', // white
};

export const RATING_LABEL: Record<CallRatingValue, string> = {
  rough: 'Black',
  okay: 'Dark',
  good: 'Light',
  great: 'White',
};

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

// Heart type is defined in heart.ts

export interface Call {
  id: string;
  user_id: string;
  call_date: string; // YYYY-MM-DD format (single day, no time)
  created_at: string;
}

// Friend type (with extended fields) is defined in friend.ts
