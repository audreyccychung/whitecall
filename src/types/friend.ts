// Friend-related types

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  friendship_id: string;
  is_on_call?: boolean; // Derived from active shift
  can_send_heart?: boolean;
}

export interface AddFriendResult {
  success: boolean;
  friend?: Friend;
  error?: string;
}
