// Database types matching Supabase schema

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  timezone: string; // User's timezone (e.g., 'America/New_York')
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
  shift_date: string; // Date in YYYY-MM-DD format
  created_at: string;
}

export interface Call {
  id: string;
  user_id: string;
  call_date: string; // YYYY-MM-DD format (single day, no time)
  created_at: string;
}

// Extended types with joined data
export interface FriendProfile extends Profile {
  friendship_id: string;
  is_on_call?: boolean; // Derived from active call
  can_send_heart?: boolean;
}
