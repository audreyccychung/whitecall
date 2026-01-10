// Database types matching Supabase schema

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  is_on_call: boolean;
  call_date: string | null; // Date when user marked themselves on call (YYYY-MM-DD)
  current_streak: number;
  longest_streak: number;
  last_heart_sent_date: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export interface Heart {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  shift_date: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  sound_enabled: boolean;
  haptic_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

// Extended types with joined data
export interface FriendProfile extends Profile {
  friendship_id: string;
  hearts_today?: number;
}
