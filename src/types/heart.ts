// Heart-related types

export interface Heart {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  shift_date: string;
  created_at: string;
}

export interface HeartWithSender extends Heart {
  sender_username: string;
  sender_display_name: string | null;
  sender_avatar_type: string;
  sender_avatar_color: string;
}

export interface SendHeartRequest {
  recipient_id: string;
  message?: string;
}

// Exhaustive result codes from send_heart DB function
export type SendHeartCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'CANNOT_SEND_TO_SELF'
  | 'RECIPIENT_NOT_FOUND'
  | 'NOT_FRIENDS'
  | 'RECIPIENT_NOT_ON_CALL'
  | 'ALREADY_SENT_TODAY'
  | 'UNKNOWN_ERROR';

export interface SendHeartResult {
  success: boolean;
  code: SendHeartCode;
  heart_id?: string; // Present on success
  error?: string; // Present when success is false
}

export interface HeartStats {
  total_received: number;
  total_sent: number;
  received_today: number;
  sent_today: number;
}
