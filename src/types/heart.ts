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

export interface SendHeartResult {
  success: boolean;
  heart?: Heart;
  error?: string;
}

export interface HeartStats {
  total_received: number;
  total_sent: number;
  received_today: number;
  sent_today: number;
}
