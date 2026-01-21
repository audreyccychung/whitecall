// Shared types used across multiple components

/**
 * Minimal person data needed to display a profile preview.
 * Used when we don't have full Friend data (e.g., group members who aren't friends).
 *
 * This type prevents the "fake Friend" pattern where we construct Friend objects
 * with placeholder values like `friendship_id: ''`.
 */
export interface PersonPreview {
  id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  // Optional fields for richer display
  is_on_call?: boolean;
  next_call_date?: string | null;
}
