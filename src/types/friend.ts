// Friend-related types

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  is_on_call: boolean;
  call_date: string | null; // Date when friend marked themselves on call (YYYY-MM-DD)
  friendship_id: string;
  hearts_received_today?: number;
  can_send_heart?: boolean;
}

export interface AddFriendRequest {
  username: string;
}

export interface AddFriendResult {
  success: boolean;
  friend?: Friend;
  error?: string;
}
