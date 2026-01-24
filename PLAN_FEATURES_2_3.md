# Plan: Notification Improvements & Group Enhancements

## Overview

**Feature 2:** Notification Improvements (Vercel Cron + Push)
**Feature 3:** Group Enhancements (Leaderboard + Quiet Day celebration)

---

## Feature 2: Notification Improvements

### Goal
Send automated push notifications:
1. **Morning reminder:** "X friends on call today - send support!"
2. **Streak risk alert:** "Send a heart to keep your Y-day streak!"

### Current State
- Push subscription infrastructure exists (`push_subscriptions` table, `save_push_subscription` RPC)
- Edge Function `send-push-notification` handles individual push delivery
- Heart trigger already sends push when someone receives a heart
- No scheduled/cron triggers exist

### Implementation Plan

#### Step 1: Create Vercel API Route for Daily Notifications

**File:** `/api/daily-notifications.ts`

```typescript
// Serverless function that:
// 1. Queries users who have friends on call today
// 2. For each user with notifications_enabled, sends push
// 3. Returns count of notifications sent
```

**Logic:**
```sql
-- Get users who should receive "friends on call" notification
SELECT DISTINCT u.id, p.current_streak
FROM profiles p
JOIN user_settings us ON us.user_id = p.id
WHERE us.notifications_enabled = TRUE
AND EXISTS (
  -- Has at least one friend on call today
  SELECT 1 FROM friendships f
  JOIN calls c ON c.user_id = (
    CASE WHEN f.user_id = p.id THEN f.friend_id ELSE f.user_id END
  )
  WHERE (f.user_id = p.id OR f.friend_id = p.id)
  AND c.call_date = CURRENT_DATE
)
AND NOT EXISTS (
  -- Hasn't sent any hearts today yet
  SELECT 1 FROM hearts h
  WHERE h.sender_id = p.id
  AND h.shift_date = CURRENT_DATE
);
```

#### Step 2: Create Vercel API Route for Streak Risk

**File:** `/api/streak-reminder.ts`

```typescript
// Serverless function that:
// 1. Queries users with active streak who haven't sent hearts today
// 2. Only if they have friends on call (otherwise can't send anyway)
// 3. Sends "keep your streak" push
```

**Logic:**
```sql
-- Users at risk of losing streak
SELECT p.id, p.current_streak
FROM profiles p
JOIN user_settings us ON us.user_id = p.id
WHERE us.notifications_enabled = TRUE
AND p.current_streak > 0
AND NOT EXISTS (
  SELECT 1 FROM hearts h
  WHERE h.sender_id = p.id
  AND h.shift_date = CURRENT_DATE
)
AND EXISTS (
  -- Has friends on call today (can still send)
  SELECT 1 FROM friendships f
  JOIN calls c ON c.user_id = (
    CASE WHEN f.user_id = p.id THEN f.friend_id ELSE f.user_id END
  )
  WHERE (f.user_id = p.id OR f.friend_id = p.id)
  AND c.call_date = CURRENT_DATE
);
```

#### Step 3: Update vercel.json with Cron Schedule

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "crons": [
    {
      "path": "/api/daily-notifications",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/streak-reminder",
      "schedule": "0 18 * * *"
    }
  ]
}
```

- **9 AM UTC:** Morning reminder (friends on call)
- **6 PM UTC:** Streak risk reminder (evening, last chance)

**Note:** UTC timing - may need adjustment based on user base timezone distribution.

#### Step 4: Shared Push Sending Logic

**File:** `/api/lib/send-push.ts`

Reuse the Web Push logic from Supabase Edge Function, but callable from Vercel serverless:
- Accept user_id + notification payload
- Query push_subscriptions for that user
- Send to all subscriptions
- Handle 410/404 (stale subscription cleanup)

#### Step 5: Environment Variables

Add to Vercel:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Files to Create/Modify

| File | Action |
|------|--------|
| `/api/daily-notifications.ts` | Create |
| `/api/streak-reminder.ts` | Create |
| `/api/lib/send-push.ts` | Create |
| `/vercel.json` | Modify (add crons) |

### Result Codes

**daily-notifications:**
- `SUCCESS` - Notifications sent
- `NO_USERS` - No users need notification today
- `UNKNOWN_ERROR` - Something failed

**streak-reminder:**
- `SUCCESS` - Reminders sent
- `NO_USERS` - No users at risk
- `UNKNOWN_ERROR` - Something failed

### Risks & Mitigations

1. **Rate limits:** Vercel free tier has cron limits (2 crons, daily only). Pro tier needed for more.
2. **Timezone mismatch:** UTC-based cron may hit users at wrong local time. Could add `timezone` column to user_settings later.
3. **Duplicate notifications:** Add `last_notified_date` column to prevent re-sending if cron runs twice.

---

## Feature 3: Group Enhancements

### 3a: Group Heart Leaderboard

**Goal:** Show which group members send the most hearts (to anyone, not just group members).

#### Database Changes

**New RPC:** `get_group_heart_leaderboard(p_group_id, p_days)`

```sql
-- Returns hearts sent by each group member in last N days
SELECT
  gm.user_id,
  p.username,
  p.display_name,
  p.avatar_type,
  p.avatar_color,
  COUNT(h.id) as hearts_sent
FROM group_members gm
JOIN profiles p ON p.id = gm.user_id
LEFT JOIN hearts h ON h.sender_id = gm.user_id
  AND h.created_at >= NOW() - INTERVAL '1 day' * p_days
WHERE gm.group_id = p_group_id
GROUP BY gm.user_id, p.username, p.display_name, p.avatar_type, p.avatar_color
ORDER BY hearts_sent DESC, p.username ASC;
```

**Result codes:** `SUCCESS`, `UNAUTHORIZED`, `GROUP_NOT_FOUND`, `NOT_A_MEMBER`, `UNKNOWN_ERROR`

#### Frontend Changes

**New component:** `GroupLeaderboard.tsx`
- Shows top 5 members by hearts sent (this week)
- Medal icons: 🥇 🥈 🥉 for top 3
- Shows heart count next to each

**Modify:** `GroupDetailPage.tsx`
- Add leaderboard section between calendar and members list

**New hook:** `useGroupLeaderboard.ts`
- Calls `get_group_heart_leaderboard` RPC
- Default period: 7 days

### 3b: Quiet Day Celebration

**Goal:** When no group member is on call today, show a celebration banner.

#### Frontend Changes

**Modify:** `GroupCalendarView.tsx`
- Already has `nextFreeDay` logic
- Add: if today IS the free day, show celebration banner

**New state:** Check if today has 0 members on call

```tsx
const todayData = calendarDays.find(d => d.date === getTodayDate());
const isQuietDay = todayData && todayData.isFree;
```

**UI:**
```tsx
{isQuietDay && (
  <motion.div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 mb-4 text-center">
    <span className="text-2xl">🎉</span>
    <p className="font-semibold text-green-700">Quiet day! No one's on call today</p>
  </motion.div>
)}
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/XXX_add_group_leaderboard.sql` | Create |
| `src/hooks/useGroupLeaderboard.ts` | Create |
| `src/components/GroupLeaderboard.tsx` | Create |
| `src/pages/GroupDetailPage.tsx` | Modify |
| `src/components/GroupCalendarView.tsx` | Modify |
| `src/types/group.ts` | Modify (add leaderboard types) |

### Complexity Assessment

| Feature | Backend | Frontend | Risk |
|---------|---------|----------|------|
| Daily notifications | High (new API routes, cron) | None | Medium |
| Streak reminder | Medium (shares infra) | None | Low |
| Group leaderboard | Low (new RPC) | Medium | Low |
| Quiet day celebration | None | Low | Very Low |

---

## Recommended Build Order

1. **Quiet day celebration** - Frontend only, 30 min
2. **Group leaderboard** - DB migration + hook + component, 2-3 hours
3. **Notification API routes** - New Vercel infrastructure, 3-4 hours
4. **Cron setup & testing** - Deploy and verify, 1-2 hours

---

## Pre-Implementation Checklist

### Leaderboard
- [x] Single source of truth: RPC returns counts, no frontend calculation
- [x] Result codes: SUCCESS, UNAUTHORIZED, GROUP_NOT_FOUND, NOT_A_MEMBER, UNKNOWN_ERROR
- [x] Can't partially succeed: Single SELECT query
- [x] Race conditions: Read-only, no issue
- [x] UI knows success: RPC returns members array on SUCCESS

### Notifications
- [ ] Single source of truth: Cron queries DB directly
- [ ] Result codes: SUCCESS, NO_USERS, UNKNOWN_ERROR
- [ ] Idempotency: Need `last_notified_date` to prevent duplicates
- [ ] Race conditions: Cron runs once per day, low risk
- [ ] Logging: Need to track what was sent for debugging

---

## Questions Before Implementation

1. **Leaderboard time period:** Default to "this week" (7 days) or "all time"?
2. **Notification timing:** 9 AM / 6 PM UTC - acceptable for your user base?
3. **Streak reminder threshold:** Only remind if streak >= 3 days? Or any streak?
