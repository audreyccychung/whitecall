// Database types matching Supabase schema

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

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
