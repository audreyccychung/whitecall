# WhiteCall Roadmap

**Goal**: Enable groups to find common free days (when no one is on call)

---

## V0.5 - Stability ✓ COMPLETE

- [x] Audit fixes (migrations, cleanup, no state guessing)
- [x] Codebase documentation (CLAUDE.md rules)
- [x] Show friend's next call date in badge

---

## V0.6 - Groups Foundation (CURRENT)

**Scope**: Create and manage groups

### Database
- [ ] Create `groups` table (id, name, created_by, created_at)
- [ ] Create `group_members` table (group_id, user_id, joined_at)
- [ ] RLS policies for group access
- [ ] `add_group_member` RPC function (atomic, with error codes)
- [ ] Migration file: `006_add_groups.sql`

### Types
- [ ] `types/group.ts` - Group, GroupMember, AddMemberResult types

### Hooks
- [ ] `useGroups` hook - list groups, create group, delete group
- [ ] `useGroupMembers` hook - list members, add member, remove member

### Pages & Components
- [ ] GroupsPage - list user's groups with create form
- [ ] GroupDetailPage - view group members, add/remove
- [ ] CreateGroupForm - name input
- [ ] GroupMembersList - show members with remove button
- [ ] AddMemberForm - add by username
- [ ] Navigation link to Groups

### Constraints
- Max 20 members per group (DB constraint)
- Only creator can add/remove members (for now)
- Group names: 3-30 characters

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
- [ ] Delete group (creator only)

### Quality
- [ ] Error handling for all group operations
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsive design

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
