// Group-related types

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_owner?: boolean;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  is_on_call: boolean;
  next_call_date: string | null; // YYYY-MM-DD or null if no upcoming calls
}

// Exhaustive result codes from create_group DB function
export type CreateGroupCode =
  | 'SUCCESS'
  | 'INVALID_NAME'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

export interface CreateGroupResult {
  success: boolean;
  code: CreateGroupCode;
  group_id?: string;
  error?: string;
}

// Exhaustive result codes from add_group_member DB function
export type AddMemberCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'NOT_OWNER'
  | 'USER_NOT_FOUND'
  | 'ALREADY_MEMBER'
  | 'GROUP_FULL'
  | 'UNKNOWN_ERROR';

export interface AddMemberResult {
  success: boolean;
  code: AddMemberCode;
  error?: string;
}

// Exhaustive result codes from remove_group_member DB function
export type RemoveMemberCode =
  | 'SUCCESS'
  | 'GROUP_NOT_FOUND'
  | 'NOT_OWNER'
  | 'CANNOT_REMOVE_SELF'
  | 'MEMBER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

export interface RemoveMemberResult {
  success: boolean;
  code: RemoveMemberCode;
  error?: string;
}

// Exhaustive result codes from delete_group DB function
export type DeleteGroupCode =
  | 'SUCCESS'
  | 'GROUP_NOT_FOUND'
  | 'NOT_OWNER'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

export interface DeleteGroupResult {
  success: boolean;
  code: DeleteGroupCode;
  error?: string;
}

// Result codes from get_my_groups RPC
export type GetMyGroupsCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

// Result codes from get_group_calls RPC
export type GetGroupCallsCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'NOT_A_MEMBER'
  | 'INVALID_DATE_RANGE'
  | 'UNKNOWN_ERROR';

// Group calendar types
export interface GroupMemberOnCall {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
}

export interface GroupCalendarDay {
  date: string; // YYYY-MM-DD
  membersOnCall: GroupMemberOnCall[];
  isFree: boolean;
}

// Result codes from leave_group RPC
export type LeaveGroupCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'NOT_A_MEMBER'
  | 'OWNER_CANNOT_LEAVE'
  | 'UNKNOWN_ERROR';

export interface LeaveGroupResult {
  success: boolean;
  code: LeaveGroupCode;
  error?: string;
}

// Result codes from generate_invite_code RPC
export type GenerateInviteCodeCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'NOT_OWNER'
  | 'UNKNOWN_ERROR';

export interface GenerateInviteCodeResult {
  success: boolean;
  code: GenerateInviteCodeCode;
  invite_code?: string;
  expires_at?: string;
}

// Result codes from join_group_by_code RPC
export type JoinGroupByCodeCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'ALREADY_MEMBER'
  | 'GROUP_FULL'
  | 'UNKNOWN_ERROR';

export interface JoinGroupByCodeResult {
  success: boolean;
  code: JoinGroupByCodeCode;
  group_id?: string;
  group_name?: string;
}

// Result from get_invite_code_info RPC
export interface InviteCodeInfo {
  valid: boolean;
  reason?: 'INVALID_CODE' | 'CODE_EXPIRED' | 'GROUP_FULL' | 'UNKNOWN_ERROR';
  group_name?: string;
  member_count?: number;
}

// Result codes from get_group_heart_leaderboard RPC
export type GetLeaderboardCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'GROUP_NOT_FOUND'
  | 'NOT_A_MEMBER'
  | 'UNKNOWN_ERROR';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_type: string;
  avatar_color: string;
  hearts_sent: number;
}
