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

## V1.3 - Retention & Engagement (NEXT)

**Scope**: Add proven retention mechanics from RETENTION_STRATEGY.md

### Priority 1: Streaks (High Impact)
- [ ] Display current streak on home screen ("🔥 7-day streak!")
- [ ] Streak logic: consecutive days sending hearts
- [ ] Streak risk notification (evening reminder if about to break)
- [ ] `current_streak`, `longest_streak` columns exist in profiles

### Priority 2: Badges (Gamification)
- [ ] "First Heart" badge (send 1)
- [ ] "Caring Colleague" badge (send 10)
- [ ] "Support Squad" badge (send 50)
- [ ] "Call Warrior" badge (survive 10 call shifts)
- [ ] Badge display on profile page
- [ ] `user_badges` table exists (schema ready)

### Priority 3: Weekly Recap
- [ ] Sunday summary: "You sent X hearts this week"
- [ ] Shareable image format (Instagram story size)
- [ ] Hearts received count

### Priority 4: Smart Feed
- [ ] Sort friends by "who needs support most"
- [ ] Prioritize friends with many shifts + few hearts received
- [ ] Label: "🆘 Dave has 4 call shifts this week"

### Profile Enhancements
- [ ] `updateProfile` RPC (change username, avatar, display name)
- [ ] Edit profile UI on Settings page

---

## V1.4 - Quality & Polish (FUTURE)

### Error Codes (Deferred from Audit)
- [ ] M5: Username validation error codes
- [ ] M6: sendHeart detailed error codes

### UX Polish
- [ ] Empty state illustrations
- [ ] Confetti on first heart received (exists but verify)
- [ ] Heart counter bounce animation (exists but verify)

### Performance
- [ ] Request deduplication for all hooks (useFriends done)
- [ ] Preload common routes

---

## Future (V2+)

- Recurring call patterns (every Monday, etc.)
- Calendar sync (Google, Apple) - Premium
- Group chat/notes
- Shift swap requests
- Anonymous "Call Survival Stories" feed
- Family mode (simplified interface for non-medical family)
- Native iOS/Android apps (Capacitor)

---

## Retention Features Status

From RETENTION_STRATEGY.md - tracking implementation:

| Feature | Status | Notes |
|---------|--------|-------|
| Daily Streaks | Schema ready | Display not implemented |
| Onboarding Tutorial | ✓ Done | `onboarding_completed` in profiles |
| Haptic/Sound Feedback | ✓ Done | `user_settings` table |
| Weekly Recap | Not started | V1.3 |
| Smart Feed | Not started | V1.3 |
| Milestone Badges | Schema ready | `user_badges` table exists |
| Group Leaderboards | Not started | V2 |
| Push Notifications | ✓ Done | Heart alerts |

---

## Database Schema Status

### Retention columns in `profiles`:
- `current_streak` - exists
- `longest_streak` - exists
- `last_heart_sent_date` - exists
- `onboarding_completed` - exists

### Tables:
- `user_settings` - exists (sound, haptic, notifications)
- `user_badges` - exists (empty, ready for badges)
- `call_ratings` - exists (rating, notes, hours_slept)
