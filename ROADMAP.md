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

## V1.4 - Quality & Polish (FUTURE)

### Error Codes (Deferred from Audit)
- [x] M5: Username validation error codes (in update_profile RPC)
- [x] M6: sendHeart detailed error codes (in send_heart RPC)

### UX Polish
- [ ] Empty state illustrations
- [x] Confetti on first heart received
- [x] Heart counter bounce animation

### Performance
- [x] Request deduplication for hooks
- [ ] Preload common routes

---

## Future (V2+)

- Calendar sync (Google, Apple) - Premium
- Group chat/notes
- Shift swap requests
- Anonymous "Call Survival Stories" feed
- Family mode (simplified interface for non-medical family)
- Native iOS/Android apps (Capacitor)

---

## Retention Features Status

| Feature | Status |
|---------|--------|
| Daily Streaks | ✓ Done |
| Onboarding Tutorial | ✓ Done |
| Haptic/Sound Feedback | ✓ Done |
| Weekly/Monthly Recap | ✓ Done |
| Smart Feed | ✓ Done |
| Milestone Badges | ✓ Done |
| Group Leaderboards | ✓ Done |
| Push Notifications | ✓ Done |
| Edit Profile | ✓ Done |

---

## Database Schema Status

### Retention columns in `profiles`:
- `current_streak` - exists, displayed
- `longest_streak` - exists, displayed
- `last_heart_sent_date` - exists
- `onboarding_completed` - exists

### Tables:
- `user_settings` - exists (sound, haptic, notifications)
- `user_badges` - exists (computed from profile data)
- `call_ratings` - exists (rating, notes, hours_slept)
- `push_subscriptions` - exists (web push)
