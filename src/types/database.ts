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
  created_at: string;
  updated_at: string;
}

// Rating display helpers
export const RATING_EMOJI: Record<CallRatingValue, string> = {
  rough: '😫',
  okay: '😐',
  good: '😊',
  great: '✨',
};

export const RATING_LABEL: Record<CallRatingValue, string> = {
  rough: 'Rough',
  okay: 'Okay',
  good: 'Good',
  great: 'Great',
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
