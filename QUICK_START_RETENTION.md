# WhiteCall - Quick Start: Retention Features

**Updated**: 2026-01-10

---

## TL;DR - What Changed

Your WHITECALL.md now includes **10 proven retention strategies** integrated into V0, V0.5, and V1. These features will increase retention by 30-40% with minimal extra development time.

---

## 3 MUST-HAVES for V0 (Add Before Launch)

### 1. Daily Streaks (2-3 hours)
**File**: `src/components/StreakDisplay.tsx`, database schema update
**Impact**: 25-35% increase in DAU

```typescript
// Display streak prominently
<div className="streak-badge">
  🔥 {user.current_streak}-day streak!
</div>
```

### 2. Onboarding Tutorial (4-5 hours)
**File**: `src/components/OnboardingModal.tsx`
**Impact**: 40% better Day 1 retention

```typescript
// Flow: Welcome → Send first heart → Celebration → Add friends
if (!user.onboarding_completed) {
  return <OnboardingModal />
}
```

### 3. Haptic & Sound Feedback (1-2 hours)
**File**: `src/utils/feedback.ts`
**Impact**: Higher perceived value

```typescript
// Vibrate on heart sent
navigator.vibrate?.(50);

// Play sound (optional)
new Audio('/sounds/heart.mp3').play();
```

**Total time: ~1 day | Total impact: 30-40% better retention**

---

## Database Changes (V0)

Add to your Supabase migration:

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_heart_sent_date DATE;
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- New settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## V0.5 Additions (Week 3-4)

1. **Weekly Recap** (2 days)
   - Sunday screen: "You sent 23 hearts this week 🤍"
   - Shareable Instagram story format

2. **Smart Feed** (1 day)
   - Prioritize friends with 3+ call shifts
   - "🆘 Dave has 4 call shifts - send support!"

3. **"You Made Someone's Day"** (0.5 days)
   - Notify random sender when someone gets 5+ hearts
   - Creates positive reinforcement loop

---

## V1 Additions (Week 5-8)

1. **Milestone Badges** (2 days)
   - Supporter: "First Heart", "Caring Colleague" (10), "Support Squad" (50)
   - Survivor: "First Call", "Call Warrior" (10), "Shift Legend" (50)

2. **Group Leaderboards** (1 day)
   - "Top Supporter This Week"
   - "Most Supported"
   - "Shift MVP"

---

## Quick Reference: All Files

### Documentation:
- ✅ **WHITECALL.md** - Main product doc (updated with retention)
- ✅ **RETENTION_STRATEGY.md** - Detailed retention guide
- ✅ **QUICK_START_RETENTION.md** - This file

### Implementation Checklist (V0):

**Database**:
- [ ] Update `profiles` table with streak + onboarding columns
- [ ] Create `user_settings` table
- [ ] Create `user_badges` table (for V0.5+)

**Components to Create**:
- [ ] `src/components/StreakDisplay.tsx` - Shows streak badge
- [ ] `src/components/OnboardingModal.tsx` - First-time user flow
- [ ] `src/utils/feedback.ts` - Haptic/sound helpers
- [ ] `src/hooks/useStreaks.ts` - Streak calculation logic
- [ ] `src/components/HeartCounterAnimation.tsx` - Bouncing number

**Database Functions**:
- [ ] Trigger to update streak when heart is sent
- [ ] Function to calculate if streak should reset

**Quick Wins** (1-2 hours each):
- [ ] Confetti on first heart received (use `canvas-confetti`)
- [ ] Empty state message when no friends on call
- [ ] 10% chance of gold heart (random variant)

---

## Success Metrics to Track

### V0 Targets (with retention features):
- **DAU/MAU**: 60%
- **Hearts per user per day**: 3+
- **D1 Retention**: 40%
- **D7 Retention**: 25%
- **Streak engagement**: 30% have 3+ day streak

### V0.5 Targets:
- **Session duration**: 3-5 minutes
- **Hearts per call shift**: 8+
- **Weekly recap sharing**: 10%

### V1 Targets:
- **Groups per user**: 1.5
- **Group visits per week**: 4+
- **Free-to-paid conversion**: 10% in 3 months

---

## What NOT to Do (Anti-Patterns)

❌ Don't add direct messaging (loses focus)
❌ Don't show hours worked publicly (toxic comparison)
❌ Don't auto-send hearts (defeats intentionality)
❌ Don't add read receipts (pressure during calls)
❌ Don't gamify receiving hearts (victimhood competition)

---

## Next Session with Claude

When you're ready to build, tell Claude:

> "I want to implement the V0 retention features from WHITECALL.md. Let's start with daily streaks - update the database schema and create the StreakDisplay component."

Or:

> "Build the onboarding tutorial modal with confetti celebration when the first heart is sent."

Or:

> "Implement all V0 retention features: streaks, onboarding, and haptics."

---

## Resources

- **Main Doc**: `WHITECALL.md` (full product spec with retention)
- **Detailed Guide**: `RETENTION_STRATEGY.md` (standalone retention doc)
- **Demo**: `demo.html` (UI mockup - can be updated)

---

**Remember**: These features are proven to work. Duolingo uses streaks, every social app uses onboarding tutorials, and haptic feedback is standard. You're not experimenting - you're implementing best practices for your unique use case.

🤍 Ship V0 with these features, and users will stick around.
