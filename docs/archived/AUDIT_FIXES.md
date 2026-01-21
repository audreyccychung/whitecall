# WhiteCall V0.5 Audit Fixes

**Created**: 2026-01-13
**Status**: COMPLETE ✓

---

## Summary

All planned audit fixes have been completed.

| Severity | Completed | Deferred |
|----------|-----------|----------|
| CRITICAL | 3/3 | 0 |
| MAJOR | 4/7 | 3 |
| MINOR | 3/4 | 1 |

---

## Completed Fixes

| ID | Issue | Fix Applied | Date |
|----|-------|-------------|------|
| C1 | `calls` table has no migration | Created `004_add_calls_table.sql` | 2026-01-13 |
| C2 | Dual on-call systems | Created `005_deprecate_legacy_oncall.sql` with COMMENT ON COLUMN + dropped legacy view | 2026-01-13 |
| C3 | Duplicate SQL files in root | Deleted 4 files: `COPY_THIS_TO_SUPABASE.sql`, `RUN_IN_SUPABASE_NOW.sql`, `ADD_FRIEND_FUNCTION.sql`, `FIX_PROFILE_CREATION.sql` | 2026-01-13 |
| M1 | Debug console.logs | Removed from: CreateProfilePage.tsx, useFriends.ts, useHearts.ts, useCalls.ts, AuthContext.tsx | 2026-01-13 |
| M2 | Duplicate heart check | Removed client-side check in useHearts.ts, now relies on DB unique constraint (error code 23505) | 2026-01-13 |
| M4 | removeFriend state guessing | Changed from local state filter to refetch from DB | 2026-01-13 |
| M7 | Inconsistent type definitions | Deleted `src/types/index.ts` (unused) | 2026-01-13 |
| m3 | Duplicate helpers.ts | Deleted `src/utils/helpers.ts` (unused, duplicated date.ts) | 2026-01-13 |
| m4 | Unused auth types | Deleted `src/types/auth.ts` (unused) | 2026-01-13 |
| - | CLAUDE.md outdated | Added Schema Documentation Rules, updated table list, added migration order rules | 2026-01-13 |

---

## Deferred Items

| ID | Issue | Reason |
|----|-------|--------|
| M3 | UNIQUE constraint on calls table | Already exists in production (verified via SQL query) |
| M5 | Username validation duplication | Works correctly, not urgent |
| M6 | sendHeart error codes | Works correctly, improve in future version |
| m1 | Unused DB features (badges, settings, streaks) | Keep for V1 |

---

## Files Changed

### Created
- `supabase/migrations/004_add_calls_table.sql`
- `supabase/migrations/005_deprecate_legacy_oncall.sql`

### Deleted
- `COPY_THIS_TO_SUPABASE.sql`
- `RUN_IN_SUPABASE_NOW.sql`
- `ADD_FRIEND_FUNCTION.sql`
- `FIX_PROFILE_CREATION.sql`
- `src/types/index.ts`
- `src/types/auth.ts`
- `src/utils/helpers.ts`

### Modified
- `CLAUDE.md` - Added Schema Documentation Rules
- `src/pages/CreateProfilePage.tsx` - Removed debug logs
- `src/hooks/useFriends.ts` - Removed debug logs, fixed removeFriend
- `src/hooks/useHearts.ts` - Removed debug logs, removed duplicate check
- `src/hooks/useCalls.ts` - Removed debug logs
- `src/contexts/AuthContext.tsx` - Removed debug logs
