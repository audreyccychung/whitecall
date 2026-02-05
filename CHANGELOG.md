# Changelog

All notable changes to Shift Calendar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Next: V2.0 - Social Features
- Activity feed with likes and comments
- Enhanced social sharing (Instagram, WhatsApp)
- Photo uploads for call stories
- Public/private post visibility

---

## [1.6.0] - 2026-02-01

### Changed - UI Consolidation

**Navigation Simplification**:
- Reduced from 5 tabs to 4 tabs (Home, Calendar, Groups, Profile)
- Removed Friends tab - friends management moved to Profile page
- Added redirect /friends → /profile for backwards compatibility

**Home Page Condensing**:
- Condensed user avatar card to compact horizontal bar
- Activity Feed promoted to hero content
- Compact friends-on-call list with tighter spacing

**Profile Page Cleanup**:
- Removed duplicate streak banner (streak only on Home now)
- Added FriendsSection component with collapsible add friend form
- Fixed Avg Quality display: emoji → MoodCircle component (grayscale)

**Onboarding**:
- Updated Groups step: "Create a Group" → "Find Free Days"

---

## [1.5.0] - 2026-01-30

### Changed - Codebase Stability Audit

**Dead Code Removal**:
- Removed unused exports from `rpc.ts` (parseRpcResponse, normalizeRpcResult)

**Consolidation**:
- Extracted `RATING_SCORES` to shared constants (was duplicated)

**Naming Cleanup**:
- Renamed `GenerateInviteCodeCode` → `InviteCodeGenCode`
- Renamed `JoinGroupByCodeCode` → `GroupJoinCode`

**Documented**:
- Implicit dependency: useCalls → global store sync
- Hearts + Friends coupling: `can_send_heart` computed in friends query

---

## [1.4.0] - 2026-01-28

### Added - Quality & Polish (Partial)

**Error Codes**:
- M5: Username validation error codes (in update_profile RPC)
- M6: sendHeart detailed error codes (in send_heart RPC)

**UX Polish**:
- Confetti on first heart received
- Heart counter bounce animation
- Request deduplication for hooks

**Pending**:
- Empty state illustrations
- Preload common routes

---

## [1.3.0] - 2026-01-26

### Added - Retention & Engagement

**Streaks**:
- Display current streak on home screen
- Streak logic: consecutive days sending hearts
- Streak risk notification (5:30 PM HKT cron reminder)
- Shareable streak card (Instagram story format)

**Badges**:
- "First Heart" badge (send 1)
- "Caring Colleague" badge (send 10)
- "Support Squad" badge (send 50)
- "Call Warrior" badge (survive 10 call shifts)
- Badge display on profile page
- `useBadges` hook

**Weekly/Monthly Recap**:
- Monthly summary with stats
- Shareable image format (Instagram story size)
- Hearts received, avg mood, avg sleep stats

**Smart Feed**:
- Sort friends by actionable first (can send heart)
- Alphabetical sort within groups

**Profile Enhancements**:
- Edit display name modal
- Edit username modal
- Edit avatar modal (change animal/color)

**Group Enhancements**:
- Quiet day celebration banner
- Group leaderboard (top 5 supporters, medals)

**Notifications**:
- Daily reminder at 10 AM HKT ("X friends on call")
- Streak reminder at 5:30 PM HKT ("Keep your streak!")

---

## [1.2.0] - 2026-01-24

### Added - Polish & Social

**Features**:
- Leave group functionality
- Google Sign-In
- Group invite links (shareable join codes)
- Add/remove friend from profile modal
- Bottom Navigation Bar
- Settings Page with avatar display
- Profile stats (trend chart, hearts/call, avg mood)
- Push notifications for heart alerts

**Technical**:
- Audit fixes (mutation locks, RPC parsing, cache management)

---

## [1.1.1] - 2026-01-21

### Added - Call Ratings & History V1.1.1

**Single Calendar with Rating Integration**:
- Unified calendar on Calls page (removed duplicate from History page)
- Future dates: tap to toggle on/off call
- Past calls: show date number with emoji underneath for rated calls
- Past calls: gray circle for unrated calls (tap to rate)
- Legend updated: "On call", "Unrated", "Rated"

**Manual Past Call Entry (+ button like Strava)**:
- New `add_past_call_with_rating` RPC (atomic call + rating insert)
- `AddPastCallModal` component with date picker + rating selection
- + button in Calls page header
- Date defaults to yesterday, max date is yesterday (no future dates)
- Result codes: SUCCESS, UNAUTHORIZED, FUTURE_DATE_NOT_ALLOWED, INVALID_RATING, CALL_ALREADY_EXISTS

**History Page Simplified**:
- Removed duplicate calendar
- List-only view of past calls
- "Edit schedule" link to Calls page
- Rating modal still works from list items

**Files Changed**:
- `CallCalendar.tsx` - added ratingsMap prop, emoji display for rated calls
- `CallsPage.tsx` - integrated rating modal, + button, ratingsMap to calendar
- `ProfilePage.tsx` - removed calendar, kept list-only view
- `AddPastCallModal.tsx` - new component
- `025_add_past_call_with_rating.sql` - new migration

---

## [0.1.0] - 2026-01-10

### Added - WhiteCall V0 COMPLETE ✅

**Core Features Implemented**:
- ✅ User authentication (email/password via Supabase)
- ✅ Avatar creation and selection (8 animals × 6 colors)
- ✅ Friend system (add by username, bidirectional friendships)
- ✅ Manual "I'm on call today" toggle
- ✅ Send white hearts 🤍 to friends on call
- ✅ Hearts appear around avatar with smooth animations
- ✅ Real-time updates via Supabase subscriptions
- ✅ One heart per friend per day (database enforced)

**Retention Features Implemented** (CRITICAL):
- ✅ **Daily streaks**: Automatic tracking via database trigger
- ✅ **Onboarding tutorial**: 4-step walkthrough with confetti celebration
- ✅ **Haptic & sound feedback**: Mobile vibration + toggleable sounds
- ✅ **Heart counter animation**: Bounce animation with Framer Motion
- ✅ **First heart confetti**: Canvas-confetti celebration
- ✅ **User settings**: Toggle sound/haptic/notifications

**Technical Implementation**:
- React 18 + TypeScript (100% type coverage)
- Vite build system (3.7s build time)
- Tailwind CSS (mobile-first responsive design)
- Framer Motion (smooth 60fps animations)
- Zustand (global state management)
- Supabase (auth, PostgreSQL, real-time subscriptions)
- React Router v6 (client-side routing)
- Canvas-confetti (celebration effects)

**Database**:
- 5 tables: profiles, friendships, hearts, user_settings, user_badges
- Row-level security policies on all tables
- Database triggers for auto-updating streaks
- Real-time subscriptions enabled
- Unique constraints to prevent duplicate hearts

**Files Created** (40+ production files):
- 11 React components
- 5 page components
- 4 custom hooks
- 5 TypeScript type definition files
- 3 utility modules
- Complete Supabase migration
- 6 documentation files

**Build Stats**:
- Production bundle: 216KB (66KB gzipped)
- Animation bundle: 130KB (44KB gzipped)
- Supabase bundle: 170KB (44KB gzipped)
- CSS: 23KB (5KB gzipped)
- Total: ~586KB raw, ~176KB gzipped
- Build time: 3.69s
- Zero TypeScript errors
- Zero linting errors

**Documentation**:
- README_V0.md - Complete setup guide
- QUICKSTART.md - 5-minute quick start
- IMPLEMENTATION_SUMMARY.md - Technical details
- DEPLOYMENT_READY.md - Deployment checklist
- FILE_STRUCTURE.md - Project organization
- BUILD_LOG.md - Build process log

### Changed
- Rebranded from "Shift Calendar" to "WhiteCall" (social support focus)
- Updated all documentation to reflect WhiteCall branding
- Mobile-first design philosophy (320px minimum width)
- Professional cute aesthetic (soft colors, rounded UI)

### Performance
- Optimized bundle splitting (react, animation, supabase separate chunks)
- Lazy loading for confetti effects
- Real-time subscription cleanup on unmount
- CSS transform animations (GPU accelerated)
- Memoized components to prevent unnecessary re-renders

### Security
- Row-level security on all database tables
- Friends can only send hearts to actual friends
- Users can only view/edit their own profiles
- Supabase JWT authentication
- HTTPS-only in production

### Next Steps
1. Create Supabase production project
2. Run database migration
3. Add environment variables
4. Deploy to Vercel
5. Beta test with 5-10 healthcare workers

### Impact Targets (V0)
- **DAU/MAU**: 60% (with streaks)
- **D1 Retention**: 40% (with onboarding)
- **D7 Retention**: 25%
- **Hearts per user per day**: 3+
- **Streak engagement**: 30% maintain 3+ day streak

### Planned for V0.5 (Week 3-4)
- Calendar and shift management
- Automatic call detection
- Message feed
- **RETENTION: Weekly recap**
- **RETENTION: Smart "who needs support" feed**
- **RETENTION: "You made someone's day" feedback**
- **RETENTION: Badge system foundation**

### Planned for V1 (Week 5-8)
- Group spaces with environments
- Avatar positioning and animations
- **RETENTION: Milestone badges**
- **RETENTION: Group leaderboards**

### Planned for V2 (Post-MVP)
- Calendar sync (Google/Apple) - Premium
- Push notifications
- Call survival stories feed
- Family mode
- Native iOS/Android apps

---

## [0.0.2] - 2026-01-10

### Added - Retention Strategy Integration
- **RETENTION_STRATEGY.md**: Comprehensive retention and engagement guide
  - 10 proven retention strategies with implementation details
  - Database schema for streaks, badges, settings
  - Push notification strategy
  - Viral loop and monetization strategies
  - Anti-patterns to avoid

- **QUICK_START_RETENTION.md**: Quick reference implementation guide
  - TL;DR summary of retention features
  - Implementation checklist
  - Database migration snippets
  - Success metrics and targets

### Changed - WHITECALL.md Major Update
- Integrated retention features into V0 section (Daily Streaks, Onboarding, Haptics)
- Integrated retention features into V0.5 section (Weekly Recap, Smart Feed, Feedback)
- Integrated retention features into V1 section (Badges, Leaderboards)
- Updated database schema with retention columns
- Updated implementation plan timelines (+2-3 days per phase)
- Updated success metrics to include retention targets (DAU/MAU, D1/D7/D30)
- Added "Anti-Patterns" section (what NOT to do)
- Added "Push Notification Strategy" section
- Added "Viral Loop Strategy" section
- Added "Monetization" section (beyond basic premium)
- Updated UI mockups to show retention features
- Changed project status to "Planning Phase with Enhanced Retention Features"

### Impact Analysis
- Expected 30-40% improvement in retention with V0 features
- Expected 25-35% increase in DAU with daily streaks
- Expected 40% better Day 1 retention with onboarding
- Expected 10% free-to-paid conversion with full strategy
- Competitive differentiation through proven engagement mechanics

---

## [0.0.1] - 2026-01-10

### Added
- Initial project setup with Vite, React 18, TypeScript
- Tailwind CSS configuration
- React Router v6 setup
- Basic project structure (pages, components, hooks, services, utils, types)
- README.md with project documentation
- CLAUDE.md with development context
- CHANGELOG.md for version tracking
- Git repository initialization

### Notes
- This is the foundation commit
- No features implemented yet, just scaffolding

---

## Template for Future Entries

```markdown
## [Version Number] - YYYY-MM-DD

### Added
- New features that were added

### Changed
- Changes to existing functionality

### Deprecated
- Features that are being phased out

### Removed
- Features that were removed

### Fixed
- Bug fixes

### Security
- Security patches or improvements
```

---

## Version History Legend

- **[Unreleased]**: Changes that are planned or in development
- **[X.Y.Z]**: Released versions
  - **X**: Major version (breaking changes, major features)
  - **Y**: Minor version (new features, backward compatible)
  - **Z**: Patch version (bug fixes, minor improvements)

## Milestone Targets

- **v0.1.0**: MVP complete with core scheduling features (Target: Month 3)
- **v0.2.0**: Calendar sync and payments (Target: Month 4)
- **v1.0.0**: Public launch (Target: Month 6)
- **v2.0.0**: Native mobile apps (Target: Month 12+)
