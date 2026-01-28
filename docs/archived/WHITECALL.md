# WhiteCall - Product Specification

**Version**: 0.1.0 (V0 Complete)
**Last Updated**: 2026-01-12

---

## What is WhiteCall?

WhiteCall is an emotional support app for healthcare workers facing call shifts. "White call" is Hong Kong medical slang for a peaceful call shift. When colleagues are on call, you can send them white hearts as encouragement.

**Core Value Proposition**: Make call shifts less lonely by enabling simple, meaningful support between colleagues.

---

## Version Roadmap

### V0 - Core Social Mechanic (COMPLETE)

**Status**: Deployed on Vercel, beta testing with users

**Features**:
- User authentication (email/password via Supabase)
- Avatar system (8 animals x 6 colors)
- Profile creation with unique username
- Friends system (add by username, bidirectional)
- Manual "I'm on call today" toggle (auto-expires at midnight)
- Send white hearts to friends on call (one per friend per day)
- Hearts displayed around avatar with animations
- Real-time heart updates via Supabase subscriptions

**Retention Features**:
- Daily streaks tracking ("X-day streak!")
- Onboarding tutorial with confetti
- Haptic & sound feedback (toggleable)
- Heart counter animation
- First heart confetti celebration
- User settings (sound/haptic preferences)

---

### V0.5 - Calendar & Enhanced Retention

**Status**: Planned

**Core Features**:
- [ ] Calendar integration for marking call shifts
- [ ] View friends' upcoming call dates (not just today)
- [ ] Automatic call detection from calendar entries
- [ ] Message feed (see who sent you hearts)

**Retention Features**:
- [ ] Weekly recap ("You sent X hearts this week") - shareable
- [ ] Smart "who needs support" feed (prioritize friends with many shifts)
- [ ] "You made someone's day" feedback notifications
- [ ] Badge system foundation

**Technical**:
- [ ] `shifts` table for calendar entries
- [ ] Friends call calendar view component

---

### V1 - Groups & Social Spaces

**Status**: Planned

**Core Features**:
- [ ] Group spaces (hospital teams, departments)
- [ ] Group calendar view
- [ ] Group member management
- [ ] Avatar positioning in group spaces

**Retention Features**:
- [ ] Milestone badges ("First Heart", "Support Squad", "Call Warrior")
- [ ] Group leaderboards (top supporter, most supported)
- [ ] Avatar idle animations (breathing, subtle movement)

**Database**:
- [ ] `groups` table
- [ ] `group_members` table
- [ ] `user_badges` table (schema exists, not populated)

---

### V1.5 - Calendar Export

**Status**: Planned (Premium Feature)

**Features**:
- [ ] ICS feed generation (subscribe URL)
- [ ] Private token-based calendar URLs
- [ ] Share calendar with family members

---

### V2 - Advanced Features

**Status**: Future

**Features**:
- [ ] Realtime subscriptions (with proper suspend/resume handling)
- [ ] Push notifications (morning/evening, streak risk, friend alerts)
- [ ] Calendar sync (Google/Apple) - Premium
- [ ] Anonymous "Call Survival Stories" feed
- [ ] Family mode (simplified interface for non-medical family)
- [ ] Capacitor wrapper for native iOS/Android apps

---

## User Feedback (V0 Beta)

### Issues Identified
1. **Email signup friction** - Users don't like providing emails, Supabase confirmation looks generic
2. **Can't see friends' future calls** - Only shows who's on call today, not upcoming

### Proposed Solutions
1. Consider customizing Supabase email templates for WhiteCall branding
2. **V0.5 priority**: Add friends call calendar view (backend already supports future dates)

---

## Success Metrics

### V0 Targets
- DAU/MAU: 60%
- D1 Retention: 40%
- D7 Retention: 25%
- Hearts per active user per day: 3+
- Streak engagement: 30% maintain 3+ day streak

### V0.5 Targets
- Session duration: 3-5 minutes
- Hearts per call shift: 8+
- Calendar adoption: 70% add shifts weekly

### V1 Targets
- Groups per user: 1.5
- Group visits per week: 4+
- Free-to-paid conversion: 10%

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind + Framer Motion
- **Backend**: Supabase (Auth, PostgreSQL, RLS, Realtime)
- **State**: Zustand
- **Routing**: React Router v6
- **Deploy**: Vercel + Supabase Cloud

---

## Database Tables

### Current (V0)
- `profiles` - User profiles with avatar, streaks, onboarding status
- `friendships` - Bidirectional friend relationships
- `hearts` - Hearts sent between users (unique per day)
- `calls` - Call dates marked by users
- `user_settings` - Sound/haptic/notification preferences
- `user_badges` - Achievement badges (schema ready, not populated)

### Planned
- `shifts` - Calendar-based shift entries (V0.5)
- `groups` - Group spaces (V1)
- `group_members` - Group membership (V1)

---

## Anti-Patterns (What NOT to Build)

- No direct messaging (keeps focus on hearts, not chat)
- No public hours worked display (avoids toxic comparison)
- No auto-send hearts (defeats intentionality)
- No read receipts (reduces pressure during calls)
- No gamification of receiving hearts (prevents victimhood competition)
- No public profile access for non-friends (privacy critical)

---

## Monetization (Future)

### Free Tier
- Unlimited hearts
- Up to 50 friends
- Basic calendar

### Premium ($4.99/month)
- Calendar sync (Google/Apple)
- ICS feed generation
- Avatar accessories
- Advanced statistics

### Additional Revenue Streams
- Custom avatar accessories ($0.99-$2.99)
- Group environments ($4.99/group)
- White-label for hospitals ($49/month)

---

## Development Philosophy

**Non-technical founder, vibe coding.** Primary goal: simplicity, deployability, long-term safety. Secondary: features.

Before implementing complex features, run complexity check:
- Date/timezone logic?
- Background jobs/triggers?
- Realtime subscriptions?
- External system sync?
- Multiple tables affected?

If 2+ are YES, simplify or reject.

---

## Files Reference

- `CLAUDE.md` - Development guidelines for Claude Code
- `README.md` - Setup and usage guide
- `QUICKSTART.md` - 5-minute quick start
- `CHANGELOG.md` - Version history
- `SUPABASE_SETUP.md` - Database setup instructions
- `RETENTION_STRATEGY.md` - Detailed retention mechanics
- `CALL_STATUS_UPDATE.md` - Auto-expiry feature changelog

---

*Built with love for healthcare workers everywhere. May your shifts always be white calls.*
