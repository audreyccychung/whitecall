# WhiteCall Roadmap

**Goal**: Enable groups to find common free days (when no one is on call)

---

## V0.5 - Stability (CURRENT)

**Status**: In Progress

### Completed
- Audit fixes (migrations, cleanup, no state guessing)
- Codebase documentation (CLAUDE.md rules)

### Remaining
- [ ] Show friend's next call date in badge
- [ ] Manual testing of core flows

---

## V0.6 - Groups Foundation

**Scope**: Create and manage groups

### Database
- [ ] Create `groups` table (id, name, created_by, created_at)
- [ ] Create `group_members` table (group_id, user_id, joined_at)
- [ ] RLS policies for group access
- [ ] Migration file: `006_add_groups.sql`

### Backend
- [ ] `useGroups` hook (CRUD operations)
- [ ] `add_group_member` RPC function (atomic, with error codes)
- [ ] Group types in `types/group.ts`

### Frontend
- [ ] GroupsPage - list user's groups
- [ ] CreateGroupForm - name input
- [ ] GroupMembersList - show members, add by username
- [ ] Navigation link to Groups

### Constraints
- Max 20 members per group (DB constraint)
- Only creator can add/remove members (for now)
- Group names: 3-30 characters

---

## V0.7 - Group Calendar View

**Scope**: See all members' calls in a date range

### Backend
- [ ] Query to fetch all calls for group members in date range
- [ ] `useGroupCalls` hook

### Frontend
- [ ] GroupCalendarView component
- [ ] Date range picker (default: next 14 days)
- [ ] Grid showing member avatars on each date they have calls
- [ ] Visual indicator for "busy" vs "free" days

### Data Structure
```typescript
type GroupCalendarDay = {
  date: string;
  membersOnCall: { id: string; username: string; avatar_type: string; avatar_color: string }[];
  isFree: boolean; // No members on call
};
```

---

## V0.8 - Find Free Day

**Scope**: Automatically find days when no group member is on call

### Backend
- [ ] `find_group_free_days` RPC function
  - Input: group_id, start_date, end_date
  - Output: array of free dates
- [ ] Efficient query (one DB call)

### Frontend
- [ ] "Find Free Day" button on group calendar
- [ ] Highlight free days in calendar view
- [ ] "Next free day: Jan 20" summary

---

## V1.0 - Polish & Launch

**Scope**: Production-ready group scheduling

### Features
- [ ] Group invites (share link)
- [ ] Leave group functionality
- [ ] Delete group (creator only)
- [ ] Group notifications (optional)

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
