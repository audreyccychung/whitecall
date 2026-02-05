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
  share_activity_feed: boolean;
  notes_private: boolean; // When true, hides notes from activity feed
  // Onboarding
  onboarding_completed: boolean;
  onboarding_version: number; // 0 = never onboarded, 1+ = completed that version
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
  okay: 'Rough',
  good: 'Okay',
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

// Activity feed types
export type ActivityType = 'call_rated';

export interface ActivityMetadata {
  call_date: string; // YYYY-MM-DD
  rating: CallRatingValue;
  hours_slept: number | null;
  notes?: string | null; // Optional - omitted if owner has notes_private=true
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  metadata: ActivityMetadata;
  like_count: number;
  comment_count: number;
  created_at: string;
  // Joined fields from get_activity_feed RPC
  display_name?: string;
  username?: string;
  avatar_type?: string;
  avatar_color?: string;
  user_has_liked?: boolean;
}

// RPC response types
export type ToggleLikeCode = 'LIKED' | 'UNLIKED' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'CANNOT_LIKE_OWN' | 'NOT_FRIENDS' | 'UNKNOWN_ERROR';

export interface ToggleLikeResponse {
  code: ToggleLikeCode;
  message?: string;
}

export type GetFeedCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface GetFeedResponse {
  code: GetFeedCode;
  activities?: Activity[];
  message?: string;
}

export type UpdateShareSettingCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface UpdateShareSettingResponse {
  code: UpdateShareSettingCode;
  enabled?: boolean;
  message?: string;
}

// Get activity likers RPC types
export type GetLikersCode = 'SUCCESS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'NOT_FRIENDS' | 'UNKNOWN_ERROR';

export interface ActivityLiker {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  created_at: string;
}

export interface GetLikersResponse {
  code: GetLikersCode;
  likers?: ActivityLiker[];
  message?: string;
}

// Update notes privacy RPC types
export type UpdateNotesPrivacyCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface UpdateNotesPrivacyResponse {
  code: UpdateNotesPrivacyCode;
  private?: boolean;
  message?: string;
}

// Get call engagement RPC types
export type GetEngagementCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface CallEngagement {
  call_date: string;
  activity_id: string;
  like_count: number;
  comment_count: number;
}

export interface GetEngagementResponse {
  code: GetEngagementCode;
  engagement?: CallEngagement[];
  message?: string;
}

// Activity comments types
export interface ActivityComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Joined fields from RPC
  username?: string;
  display_name?: string | null;
  avatar_type?: string;
  avatar_color?: string;
}

export type AddCommentCode = 'SUCCESS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'NOT_FRIENDS' | 'CANNOT_COMMENT_OWN' | 'CONTENT_TOO_LONG' | 'CONTENT_EMPTY' | 'UNKNOWN_ERROR';

export interface AddCommentResponse {
  code: AddCommentCode;
  comment_id?: string;
  message?: string;
}

export type GetCommentsCode = 'SUCCESS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'NOT_FRIENDS' | 'UNKNOWN_ERROR';

export interface GetCommentsResponse {
  code: GetCommentsCode;
  comments?: ActivityComment[];
  message?: string;
}

export type DeleteCommentCode = 'SUCCESS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'NOT_OWN_COMMENT' | 'UNKNOWN_ERROR';

export interface DeleteCommentResponse {
  code: DeleteCommentCode;
  message?: string;
}

// Notification types
export type NotificationType = 'like' | 'comment';

export interface Notification {
  id: string;
  type: NotificationType;
  activity_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  // Joined fields from RPC
  actor_id: string;
  actor_username: string;
  actor_display_name: string | null;
  actor_avatar_type: string;
  actor_avatar_color: string;
  call_date: string | null;
  rating: string | null;
  comment_preview: string | null;
}

export type GetNotificationsCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface GetNotificationsResponse {
  code: GetNotificationsCode;
  notifications?: Notification[];
  unread_count?: number;
  message?: string;
}

export type MarkNotificationsReadCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface MarkNotificationsReadResponse {
  code: MarkNotificationsReadCode;
  updated_count?: number;
  message?: string;
}

export type GetUnreadCountCode = 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR';

export interface GetUnreadCountResponse {
  code: GetUnreadCountCode;
  count?: number;
  message?: string;
}
