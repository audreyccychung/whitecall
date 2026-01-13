# V0.6 Audit Fixes Progress

**Started:** 2026-01-13
**Status:** COMPLETE

---

## Critical Fixes (Must Complete Before V0.6)

### C1: Optimistic State Update in useCalls
- **Location:** `src/hooks/useCalls.ts:74-76, 104-108`
- **Problem:** Updates local state before confirming DB success
- **Fix:** Refetch from DB after mutation instead of local state manipulation
- **Status:** [x] COMPLETE
- **Changes:**
  - `createCall`: Removed `.select().single()`, now calls `loadCalls()` after insert
  - `deleteCall`: Removed local state manipulation, now calls `loadCalls()` after delete
  - Removed unused `addCallDate`/`removeCallDate` store actions

### C2: Missing `remove_friend` RPC
- **Location:** `src/hooks/useFriends.ts:182-222`
- **Problem:** `addFriend` uses RPC with error codes, `removeFriend` uses direct delete
- **Fix:** Add `remove_friend` RPC function with error codes
- **Status:** [x] COMPLETE
- **Changes:**
  - Created `supabase/migrations/006_add_remove_friend_function.sql`
  - Added `RemoveFriendCode`, `RemoveFriendResult` types to `src/types/friend.ts`
  - Updated `removeFriend` to use RPC with exhaustive error codes
  - Function signature changed: takes `friendId` (UUID) instead of `friendshipId`

### C3: sendHeart Has No Error Contract
- **Location:** `src/hooks/useHearts.ts:122-166`
- **Problem:** Free-form error strings, no exhaustive error codes
- **Fix:** Add `send_heart` RPC function with error codes
- **Status:** [x] COMPLETE
- **Changes:**
  - Created `supabase/migrations/007_add_send_heart_function.sql`
  - Added `SendHeartCode` type to `src/types/heart.ts`
  - Updated `SendHeartResult` to include `code` and `heart_id` fields
  - Updated `sendHeart` to use RPC with exhaustive error codes
  - RPC validates: authorization, not self, recipient exists, is friend, recipient on call, not already sent

---

## Major Fixes (Type Consolidation)

### M1: Duplicate Heart Type
- **Fix:** Delete from `database.ts`, keep in `heart.ts`
- **Status:** [x] COMPLETE
- **Changes:** Removed `Heart` interface from `database.ts`, added comment pointing to `heart.ts`

### M2: Duplicate Profile Type
- **Fix:** Delete from `avatar.ts`, keep in `database.ts`
- **Status:** [x] COMPLETE
- **Changes:** Removed `Profile` interface from `avatar.ts`, added comment pointing to `database.ts`

### M3: FriendProfile vs Friend
- **Fix:** Delete `FriendProfile` from `database.ts`, use `Friend` from `friend.ts`
- **Status:** [x] COMPLETE
- **Changes:** Removed `FriendProfile` interface from `database.ts`, added comment pointing to `friend.ts`

### M5: Legacy Columns
- **Fix:** Add migration to drop legacy columns
- **Status:** [x] COMPLETE
- **Changes:** Created `supabase/migrations/008_drop_legacy_oncall_columns.sql`
  - Drops `profiles.is_on_call` and `profiles.call_date` columns
  - These were deprecated in migration 005

---

## Files Modified

### Migrations
- `supabase/migrations/006_add_remove_friend_function.sql` (created)
- `supabase/migrations/007_add_send_heart_function.sql` (created)
- `supabase/migrations/008_drop_legacy_oncall_columns.sql` (created)

### Types
- `src/types/friend.ts` - Added `RemoveFriendCode`, `RemoveFriendResult`
- `src/types/heart.ts` - Added `SendHeartCode`, updated `SendHeartResult`
- `src/types/database.ts` - Removed duplicate `Heart`, `FriendProfile`
- `src/types/avatar.ts` - Removed duplicate `Profile`

### Hooks
- `src/hooks/useCalls.ts` - Refetch after mutations (no optimistic updates)
- `src/hooks/useFriends.ts` - Use `remove_friend` RPC with error codes
- `src/hooks/useHearts.ts` - Use `send_heart` RPC with error codes

---

## All Critical and Major Fixes COMPLETE

**Status:** COMPLETE
**Completed:** 2026-01-13
