# Bug Tracker

## RESOLVED

### 1. Add Friend False Negative (2026-01-13)
**Symptom:** "Failed to add friend" error shown even when friend was successfully added.

**Root Cause:** Frontend assumed `data.code` exists directly on RPC response, but Supabase can return data in different shapes (stringified JSON, wrapped objects).

**Fix:** Normalize RPC response in `useFriends.ts`:
```typescript
let result: { code?: string };
if (typeof data === 'string') {
  result = JSON.parse(data);
} else if (data && typeof data === 'object') {
  result = data;
} else {
  result = {};
}
```

**File:** `src/hooks/useFriends.ts` (lines 129-141)

**Status:** Fixed on localhost. Vercel needs redeployment.

---

### 2. Profile Creation 406 Error (2026-01-13)
**Symptom:** `.single()` returns 406 when no rows found.

**Fix:** Changed to `.maybeSingle()` which returns null instead of error.

**File:** `src/pages/CreateProfilePage.tsx`

**Status:** Fixed.

---

## PENDING INVESTIGATION

### 3. Vercel Deployment Stale Cache
**Symptom:** Localhost works, Vercel shows old behavior.

**Action Required:** Redeploy on Vercel or push new commit to trigger rebuild.

---

## DEBUG LOGS TO REMOVE

After confirming fixes work in production, remove these debug logs:

1. `src/hooks/useFriends.ts:118` - `console.log('add_friend RPC response:...')`
2. `src/pages/CreateProfilePage.tsx:67` - `console.log('Debug - Creating profile:...')`
3. `src/pages/CreateProfilePage.tsx:83` - `console.log('Profile check:...')`
4. `src/pages/CreateProfilePage.tsx:100` - `console.log('Username check:...')`

---

## PROTOCOL REMINDERS

Per CLAUDE.md, all mutations must:
1. Have single source of truth (DB function)
2. Be atomic (no partial success)
3. Have exhaustive error codes
4. Never guess state (refetch after mutation)
5. Define error contract before implementation
