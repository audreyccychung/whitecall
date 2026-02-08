# WhiteCall Roadmap

**Goal**: Enable groups to find common free days (when no one is on call)

---

## V0.5 - Stability ✓ COMPLETE

- [x] Audit fixes (migrations, cleanup, no state guessing)
- [x] Codebase documentation (CLAUDE.md rules)
- [x] Show friend's next call date in badge

---

## V0.6 - Groups Foundation ✓ COMPLETE

- [x] Groups table, RLS, RPC functions
- [x] 20-member limit, owner-only management
- [x] GroupsPage, GroupDetailPage, member management

---

## V0.7 - Friend Profile Modal ✓ COMPLETE

- [x] Tap friend → slide-up modal with upcoming calls
- [x] `useFriendCalls` hook

---

## V0.9 - Group Calendar + Find Free Day ✓ COMPLETE

- [x] `get_group_calls` RPC
- [x] 14-day calendar grid with member avatars
- [x] "Next free day" banner
- [x] DayDetailModal

---

## V1.1 - Call Ratings & History ✓ COMPLETE

- [x] Rating system (rough/okay/good/great)
- [x] Sleep tracking (hours slept)
- [x] Manual past call entry
- [x] Calendar shows emoji for rated calls

---

## V1.2 - Polish & Social ✓ COMPLETE

- [x] Leave group functionality
- [x] Google Sign-In
- [x] Group invite links (shareable join codes)
- [x] Add/remove friend from profile modal
- [x] Bottom Navigation Bar
- [x] Settings Page with avatar display
- [x] Profile stats (trend chart, hearts/call, avg mood)
- [x] Push notifications for heart alerts
- [x] Audit fixes (mutation locks, RPC parsing, cache management)

---

## V1.3 - Retention & Engagement ✓ COMPLETE

### Streaks
- [x] Display current streak on home screen and profile
- [x] Streak logic: consecutive days sending hearts
- [x] Streak risk notification (5:30 PM HKT cron reminder)
- [x] Shareable streak card (Instagram story format)

### Badges
- [x] "First Heart" badge (send 1)
- [x] "Caring Colleague" badge (send 10)
- [x] "Support Squad" badge (send 50)
- [x] "Call Warrior" badge (survive 10 call shifts)
- [x] Badge display on profile page
- [x] `useBadges` hook

### Weekly/Monthly Recap
- [x] Monthly summary with stats
- [x] Shareable image format (Instagram story size)
- [x] Hearts received, avg mood, avg sleep stats

### Smart Feed
- [x] Sort friends by actionable first (can send heart)
- [x] Alphabetical sort within groups

### Profile Enhancements
- [x] Edit display name modal
- [x] Edit username modal
- [x] Edit avatar modal (change animal/color)

### Group Enhancements
- [x] Quiet day celebration banner
- [x] Group leaderboard (top 5 supporters, medals)

### Notifications
- [x] Daily reminder at 10 AM HKT ("X friends on call")
- [x] Streak reminder at 5:30 PM HKT ("Keep your streak!")

---

## V1.4 - Quality & Polish ✓ COMPLETE

### Error Codes (Deferred from Audit)
- [x] M5: Username validation error codes (in update_profile RPC)
- [x] M6: sendHeart detailed error codes (in send_heart RPC)

### UX Polish
- [x] Empty state illustrations (emoji headers on all empty states)
- [x] Confetti on first heart received
- [x] Heart counter bounce animation

### Performance
- [x] Request deduplication for hooks
- [x] Preload common routes (N/A — all routes are static imports, app loads as single bundle)

---

## V1.5 - Codebase Stability Audit ✓ COMPLETE

### Dead Code Removal
- [x] Remove unused exports from `rpc.ts` (parseRpcResponse, normalizeRpcResult)

### Consolidation
- [x] Extract `RATING_SCORES` to shared constants (was duplicated in useProfileStats and WeeklyRecap)

### Naming Cleanup
- [x] Rename `GenerateInviteCodeCode` → `InviteCodeGenCode`
- [x] Rename `JoinGroupByCodeCode` → `GroupJoinCode`

### Documented (Not Changed)
- [x] Implicit dependency: useCalls → global store sync (HomePage depends on this)
- [x] Hearts + Friends coupling: `can_send_heart` computed in friends query

---

## V1.6 - UI Consolidation ✓ COMPLETE

### Navigation Simplification
- [x] Remove Friends tab (5 tabs → 4 tabs: Home, Calendar, Groups, Profile)
- [x] Move friends management to Profile page (FriendsSection component)
- [x] Redirect /friends → /profile for backwards compatibility

### Home Page Condensing
- [x] Condense user avatar card to compact horizontal bar
- [x] Two-line status message ("You're not on call today" + "Want to support a friend?")
- [x] Compact friends-on-call list with tighter spacing
- [x] Activity Feed as hero content

### Profile Page Cleanup
- [x] Remove duplicate streak banner (streak only on Home)
- [x] Add FriendsSection with collapsible add friend form
- [x] Fix Avg Quality emoji → MoodCircle component (grayscale: white=best, black=worst)

### Onboarding
- [x] Update Groups step: "Create a Group" → "Find Free Days"

---

## V1.7 - Shift Type Calendar ✓ COMPLETE

### Work Patterns
- [x] Users choose work pattern in Settings (call-based or shift-based)
- [x] `work_pattern` column on profiles (default 'call')
- [x] `update_work_pattern` RPC for changing pattern

### Shift Types
- [x] `shift_type` column on calls table (default 'call')
- [x] Call-based: Call (blue), Day Off (teal), Full Day Work (purple), Half Day (orange)
- [x] Shift-based: AM (yellow), PM (blue), Night (indigo), Off (teal)
- [x] Frontend constants for all 8 shift types (label, color, icon, pattern)

### Bottom Sheet Picker
- [x] Tap date → bottom sheet slides up with shift type options
- [x] Shows only shift types for user's work pattern
- [x] Auto-advances to next day after selection
- [x] Sheet stays open for rapid consecutive-day entry
- [x] Clear button to remove a shift from a date
- [x] Mobile-first, touch targets >= 44px

### Calendar Visual Updates
- [x] Future dates: colored circle with shift type color
- [x] Past dates: desaturated color (preserves hue identity)
- [x] Past ratable dates: clickable for rating (call-based: only calls; shift-based: all)
- [x] Legend shows shift types for current work pattern

### Integration
- [x] Zustand store updated (callDates Set → shiftMap Map)
- [x] ICS export includes shift type labels
- [x] Settings page work pattern selector
- [x] HomePage on-schedule badge works with any shift type

---

## V2.0 - Calendar Visual Redesign ✓ COMPLETE

### Calm Status Calendar
- [x] Pastel color palette (reduced saturation ~25%, increased lightness)
- [x] `accentColor` field on all shift types for accent indicators
- [x] Rounded-xl cells (was rounded-full) for status-calendar aesthetic
- [x] Inset left-edge bracket accent (`inset 3px box-shadow`)
- [x] Soft background tint (8% opacity for future, 4% for past)
- [x] Today as sole hero cell (sky-soft tint + ring, bold text)
- [x] Past shifts muted (low-opacity tint + bracket + gray text)

### Calendar UX
- [x] All past dates editable (tap opens shift picker, was previously blocked)
- [x] Long-press past ratable shifts to open rating modal
- [x] "Long-press a past call to rate it" hint below legend
- [x] Upcoming calls list filters by work pattern (no day-offs shown)
- [x] Call emoji changed from phone to white heart

### Picker & List Updates
- [x] ShiftPickerSheet: softer icon circles (25% opacity pastel bg)
- [x] ShiftPickerSheet: accentColor for selection ring
- [x] Upcoming calls: adjusted opacity/color for new pastel palette
- [x] Legend: small bars instead of dots (echoes left-edge accent)

---

## V2.1 - Type Cleanup & On-Call Fix ✓ COMPLETE

### Type System
- [x] Add `PersonData` base type (shared display fields across Friend, GroupMember, etc.)
- [x] Friend, GroupMember, GroupMemberOnCall, LeaderboardEntry extend PersonData
- [x] Remove redundant `id` field from GroupMember (keep only `user_id`)
- [x] Add `UseHeartsResult` and `UseFriendsResult` return type interfaces

### On-Call Status Fix
- [x] Only on-duty shifts (`call`, `am`, `pm`, `night`) count as "on call"
- [x] Fix 6 RPCs: get_group_calls, get_group_members, get_friends_with_status, send_heart, daily notification, streak reminder
- [x] Add `isOnDutyShift()` frontend helper matching backend filter
- [x] Fix HomePage on-call badge to check shift type

### Deferred
- [ ] Update group calendar views to show shift type colors (deferred — see V2.2)

---

## Future (V2.2+)

### V2.2 - Medium-term Features
- [ ] Show shift type colors in group DayDetailModal (deferred from V2.1)
- [ ] ICS calendar feed import (auto-populate calls from exported schedule)
- [ ] Group statistics page (aggregate mood, support patterns)
- [ ] "Most supported" vs "least supported" friend insights
- [ ] Quiet day celebration notifications for groups
- [ ] Multi-day shift spanning support

### V3.0 - Long-term / Premium
- [ ] Calendar sync (Google, Apple) - Premium
- [ ] Group chat/notes
- [ ] Shift swap requests
- [ ] Anonymous "Call Survival Stories" feed
- [ ] Family mode (simplified interface for non-medical family)
- [ ] Native iOS/Android apps (Capacitor)

---

## Retention Features Status

| Feature | Status |
|---------|--------|
| Daily Streaks | ✓ Done |
| Onboarding Tutorial | ✓ Done (modal with 4 steps) |
| Haptic/Sound Feedback | Not implemented (skeleton exists) |
| Weekly/Monthly Recap | ✓ Done |
| Smart Feed | ✓ Done |
| Milestone Badges | ✓ Done (computed, not persisted) |
| Group Leaderboards | ✓ Done |
| Push Notifications | ✓ Done |
| Edit Profile | ✓ Done |
| UI Consolidation | ✓ Done (4 tabs, condensed home) |

---

## Database Schema Status

### Retention columns in `profiles`:
- `current_streak` - exists, displayed
- `longest_streak` - exists, displayed
- `last_heart_sent_date` - exists
- `onboarding_completed` - exists (not used in UI)
- `work_pattern` - exists ('call' or 'shift', default 'call')

### Tables:
- `calls` - shift scheduling (call_date, shift_type)
- `call_ratings` - exists (rating, notes, hours_slept)
- `user_settings` - exists (not actively used)
- `user_badges` - exists (but badges are computed, not written)
- `push_subscriptions` - exists (web push)

---

## Codebase Health (Post-Audit)

### What's Solid ✓
- Exhaustive error codes on all mutations
- Single source of truth for data (refetch after mutations)
- RLS policies without circular dependencies
- Module-level caching with stale time checks
- Consistent hook patterns

### Known Coupling (Acceptable)
- Hearts ↔ Friends: `can_send_heart` flag computed in friends query
- useCalls ↔ Zustand store: shift map synced for HomePage on-schedule badge
- Shift type display config: frontend constants (`src/constants/shiftTypes.ts`), DB stores codes only

### Technical Debt (Low Priority)
- Snake_case in TypeScript types (matches DB, but unconventional)
- No explicit return type interfaces on some hooks
- `user_badges` table unused (badges computed from profile data)
