# CLAUDE.md - WhiteCall

## Project
**WhiteCall** - Emotional support app for healthcare workers on call shifts. "White call" = HK medical slang for peaceful call shift. Friends send white hearts to colleagues on call.

**Stage**: V0 - Minimal viable social mechanic

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind + Framer Motion
- Backend: Supabase (Auth, PostgreSQL, RLS)
- State: Zustand (global)
- Routing: React Router v6
- Dates: date-fns
- Forms: react-hook-form
- Deploy: Vercel + Supabase Cloud

## File Structure
```
src/
├── pages/           # Route components
├── components/ui/   # Generic (Button, Input, Modal)
├── components/features/  # Domain-specific (ShiftCard, HeartButton)
├── hooks/           # useAuth, useShifts, etc.
├── services/        # API/business logic
├── utils/           # Pure helpers
├── types/           # TypeScript interfaces
```

## Naming
- Components: PascalCase (`ShiftCard.tsx`)
- Hooks: `use` prefix (`useAuth.ts`)
- DB tables/columns: snake_case

## V0 Database Tables
profiles, friendships, hearts, shifts, shift_templates

Key rules:
- Store times in UTC (timestamptz), display in user timezone
- Detect timezone on signup via `Intl.DateTimeFormat().resolvedOptions().timeZone`, store in profile
- Shifts can span multiple days (24-34 hour calls)
- Call status derived from shifts table, not a flag
- RLS: users see own data + friends' data where permitted
- No realtime subscriptions - refetch on focus/action instead

## V0 Scope

**Build:**
- Auth (email/password)
- Avatar selection
- Add friends
- Create shifts (with templates)
- View friends on call today
- Send hearts (one at a time, intentional)
- Simple "You supported X friends today" message

**Don't build yet:**
- Streaks
- Realtime subscriptions
- Haptics/sound
- Onboarding tutorial/confetti
- Badges
- Groups
- ICS calendar export
- Push notifications

## Development Philosophy

**Non-technical founder, vibe coding.** Primary goal: simplicity, deployability, long-term safety. Secondary: features.

Before implementing, run complexity check (if 2+ are YES, simplify or reject):
- Date/timezone logic?
- Background jobs/triggers?
- Realtime subscriptions?
- External system sync?
- Multiple tables affected?
- Rules enforced in multiple places?
- Breaks offline or on mobile suspend?
- State that can desync?

**Hard bans:** No database triggers, no cron jobs, no background workers, no realtime subscriptions, no two-way sync, no premature abstractions.

**Expected behavior:** Recommend NOT building if it adds fragility. Ask before writing code.

## Critical Rules

**No backward compatibility** - Refactor freely during MVP. Breaking changes OK.

**Ask when uncertain** - Never hallucinate APIs/methods. If unsure, ask.

**Plan Mode for new features** - Enter plan mode, write plan, present summary, wait for approval before implementing.

**Flag issues proactively** - Performance, security, UX problems - speak up immediately.

## Healthcare Domain
- Shifts: 1-36 hours max, often 24-34 hour calls
- Multi-day handling: Monday 8am → Tuesday 12pm shows on both days
- DST/timezone edge cases matter
- Users are tired/stressed - minimize cognitive load

## Design
- Mobile-first (320px → 768px → 1024px+)
- Touch targets: 44px minimum
- Professional-cute aesthetic
- One primary action per screen

## PWA Requirements
- Manifest: display: standalone, theme_color, 512x512 icon, dynamic start_url
- Service worker: network-first for API/auth, cache static assets only
- Auth: handle token refresh, survive suspend/resume, no permanent storage assumptions
- All network actions need loading, error, and offline states
- Avoid browser-only APIs (plan for Capacitor wrapper later)
- Env vars via import.meta.env, no hardcoded URLs/keys

## Future (Not V0)

**V0.5 - Retention:**
- Daily streaks with timezone-safe date math
- Haptic feedback + optional sound
- Onboarding tutorial with confetti
- Weekly recap ("You sent X hearts this week")

**V1 - Groups:**
- groups, group_members tables
- Group spaces with avatars
- Group leaderboards

**V1.5 - Calendar Export:**
- ICS feed generation (subscribe URL)
- Private token-based calendar URLs

**V2 - Advanced:**
- Realtime subscriptions (with proper suspend/resume handling)
- Badges system (user_badges table)
- Push notifications (abstracted interface for native bridge)
- Capacitor wrapper for iOS/Android
