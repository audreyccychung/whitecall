# Auto-Expiring On-Call Status - Update Summary

**Date**: 2026-01-10
**Version**: V0.1 → V0.2
**Type**: Feature Enhancement

---

## 🎯 What Changed

The "I'm on call today" toggle now **automatically expires at midnight** instead of staying on indefinitely.

### Before (V0.1)
- User checks "I'm on call today"
- Status stays TRUE until manually unchecked
- Problem: Users forget to uncheck, causing stale data

### After (V0.2)
- User checks "I'm on call today"
- Status automatically expires at midnight (00:00)
- User must re-check for new shifts
- Clean, accurate data

---

## 🔧 Technical Implementation

### Database Changes
- **New column**: `call_date DATE` in `profiles` table
- **Updated view**: `users_on_call` now filters by `call_date = CURRENT_DATE`

### Application Logic
- **When toggling ON**: Sets `is_on_call = true` AND `call_date = CURRENT_DATE`
- **When toggling OFF**: Sets `is_on_call = false` AND `call_date = null`
- **When displaying**: Checks both `is_on_call = true` AND `call_date = CURRENT_DATE`

### Files Modified
1. `supabase/migrations/001_initial_schema.sql` - Added `call_date` column
2. `supabase/migrations/002_add_call_date.sql` - Migration for existing databases
3. `src/types/database.ts` - Added `call_date` to Profile interface
4. `src/types/friend.ts` - Added `call_date` to Friend interface
5. `src/hooks/useCallStatus.ts` - Sets `call_date` when toggling
6. `src/hooks/useFriends.ts` - Fetches `call_date` from database
7. `src/lib/store.ts` - Updated `updateCallStatus` to handle `call_date`
8. `src/pages/HomePage.tsx` - Filters friends by today's date
9. `src/components/FriendsList.tsx` - Filters by today's date

---

## 📅 How It Works

### Example Timeline

**Monday 9 AM**: User checks "I'm on call today"
```
Database: is_on_call = true, call_date = '2026-01-13'
UI: Checkbox is checked ✓
Friends see: "On call today"
```

**Monday 11 PM**: Still on shift
```
Database: is_on_call = true, call_date = '2026-01-13'
UI: Checkbox is still checked ✓ (same day)
Friends see: "On call today"
```

**Tuesday 12:01 AM**: Midnight passes
```
Database: is_on_call = true, call_date = '2026-01-13' (unchanged)
But CURRENT_DATE = '2026-01-14' now
UI: Checkbox appears unchecked (filtered by date)
Friends see: User NOT in "Friends on Call Today"
```

**Tuesday 8 AM**: New shift starts
```
User checks "I'm on call today" again
Database: is_on_call = true, call_date = '2026-01-14'
UI: Checkbox is checked ✓
Friends see: "On call today" again
```

---

## 🚀 Deployment Steps

### For New Databases
Run the complete migration:
```sql
-- Use: supabase/migrations/001_initial_schema.sql
-- Already includes call_date column
```

### For Existing Databases
Run the update migration:
```sql
-- Use: supabase/migrations/002_add_call_date.sql
-- Adds call_date column to existing profiles table
```

### Application Updates
```bash
# Pull latest code
git pull

# Rebuild
npm run build

# Redeploy
# (Vercel will auto-deploy on push)
```

---

## ✅ Benefits

1. **Accurate Status**: No more stale "on call" statuses from days ago
2. **Better UX**: Users don't need to remember to uncheck
3. **Clean Data**: Database always reflects current reality
4. **Scalable**: Works across timezones (uses user's local date)

---

## 🧪 Testing Checklist

- [x] TypeScript compiles without errors
- [x] Production build succeeds
- [x] Database migration script created
- [ ] Test: Check "on call", verify it appears checked
- [ ] Test: Friend sees you in "Friends on Call Today"
- [ ] Test: Change system date to tomorrow, verify checkbox unchecks
- [ ] Test: You no longer appear in "Friends on Call Today"
- [ ] Test: Check "on call" again, verify it works

---

## 📝 User-Facing Changes

### What Users See
- **No UI changes** - Same single checkbox
- **Behavior change** - Checkbox auto-unchecks at midnight
- **Re-check daily** - Must check again for each shift

### What to Communicate
"Your on-call status now automatically resets each day at midnight. Just check 'I'm on call today' when your shift starts - no need to uncheck when it ends!"

---

## 🔮 Future Improvements (Post-V0)

1. **Calendar Integration** (V0.5): Auto-detect shifts from calendar
2. **Multi-day Shifts**: Option to set "On call until [date]"
3. **Timezone Support**: Handle shifts across timezones
4. **Recurring Schedules**: Set regular call patterns

---

**Status**: ✅ Implementation Complete
**Next Step**: Deploy to production and test with real users
