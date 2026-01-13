// Friend-related types

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  friendship_id: string;
  is_on_call?: boolean; // Derived from active call (today)
  next_call_date?: string; // Next call date (today or future, YYYY-MM-DD)
  can_send_heart?: boolean;
}

// Exhaustive result codes from add_friend DB function
export type AddFriendCode =
  | 'SUCCESS'
  | 'USER_NOT_FOUND'
  | 'ALREADY_FRIENDS'
  | 'CANNOT_ADD_SELF'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

export interface AddFriendResult {
  success: boolean;
  code: AddFriendCode;
  error?: string; // Present when success is false
}
