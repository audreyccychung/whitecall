# WhiteCall Roadmap

**Goal**: Enable groups to find common free days (when no one is on call)

---

## V0.5 - Stability ✓ COMPLETE

- [x] Audit fixes (migrations, cleanup, no state guessing)
- [x] Codebase documentation (CLAUDE.md rules)
- [x] Show friend's next call date in badge

---

## V0.6 - Groups Foundation ✓ COMPLETE

**Scope**: Create and manage groups

### Database
- [x] Create `groups` table (id, name, created_by, created_at)
- [x] Create `group_members` table (group_id, user_id, joined_at)
- [x] RLS policies for group access
- [x] `create_group` RPC function (atomic, with error codes)
- [x] `add_group_member` RPC function (atomic, with error codes)
- [x] `remove_group_member` RPC function (atomic, with error codes)
- [x] `delete_group` RPC function (atomic, with error codes)
- [x] Migration file: `009_add_groups.sql`
- [x] 20-member limit trigger (prevents race conditions)

### Types
- [x] `types/group.ts` - Group, GroupMember, result types

### Hooks
- [x] `useGroups` hook - list groups, create group, delete group
- [x] `useGroupMembers` hook - list members, add member, remove member

### Pages & Components
- [x] GroupsPage - list user's groups with create form
- [x] GroupDetailPage - view group members, add/remove, delete group
- [x] CreateGroupForm - name input with validation
- [x] GroupMembersList - show members with remove button
- [x] AddMemberForm - add by username
- [x] GroupCard - group display in list
- [x] Navigation link to Groups in HomePage

### Constraints
- Max 20 members per group (DB trigger + RPC check)
- Only creator can add/remove members
- Group names: 3-30 characters
- Self-healing for I11 invariant (creator always member)

### Bug Fixes (Post-Release)
- [x] Migration 010: Fix `group_members` RLS circular dependency (first attempt)
- [x] Migration 011: Fix `groups` RLS infinite recursion (owner-only simplification)
- [x] Migration 012: Restore owner visibility of group members

**Current V0.6 Limitations:**
- Non-owner members cannot see groups they belong to (V1 fix: `get_my_groups()` RPC)
- Non-owner members cannot see other members (V1 fix: `get_group_members()` RPC)

---

## V0.7 - Friend Profile Modal ✓ COMPLETE

**Scope**: View a friend's upcoming call schedule

### Feature
- [x] Tap friend card → slide-up modal (bottom sheet)
- [x] Show friend avatar, display name, username
- [x] List upcoming calls (next 30 days, future only)
- [x] Highlight next upcoming call
- [x] Truncate to ~6 dates with "+N more" if needed
- [x] Empty state: "No upcoming calls scheduled"

### Implementation
- [x] `FriendProfileModal` component
- [x] `useFriendCalls(friendId)` hook - fetch calls for next 30 days
- [x] No DB changes needed (RLS already allows friend call access)

### Explicit Non-Goals
- No calendar grid or month view
- No date picker or editing
- No group logic
- No past calls

---

## V0.9 - Group Calendar + Find Free Day

**Scope**: See all members' calls and find common free days

### Backend
- [ ] `useGroupCalls` hook - fetch calls for all members in date range
- [ ] Free day calculation (client-side, from fetched data)

### Frontend
- [ ] GroupCalendarView component
- [ ] 14-day grid showing member avatars on busy days
- [ ] Green highlight on free days (no one on call)
- [ ] "Next free day: Jan 20" summary at top
- [ ] Click day to see who's on call

### Data Structure
```typescript
type GroupCalendarDay = {
  date: string;
  membersOnCall: { id: string; username: string; avatar_type: string; avatar_color: string }[];
  isFree: boolean;
};
```

---

## V1.0 - Polish & Launch

**Scope**: Production-ready group scheduling

### Features
- [ ] Group invites (share link)
- [ ] Leave group functionality
- [ ] `get_my_groups()` RPC - let non-owner members see groups they belong to
- [ ] `get_group_members()` RPC - let non-owner members see other members
- [x] Delete group (creator only) - done in V0.6

### Quality
- [x] Error handling for all group operations - done in V0.6
- [x] Loading states - done in V0.6
- [x] Empty states - done in V0.6
- [x] Mobile responsive design - done in V0.6

### Deferred from Audit
- [ ] M5: Username validation error codes
- [ ] M6: sendHeart error codes
- [ ] m1: Badges/settings/streaks features

---

## Future (V1.x+)

- Recurring call patterns (every Monday, etc.)
- Calendar sync (Google, Apple)
- Push notifications
- Group chat/notes
- Shift swap requests
