# WhiteCall User Journey Map

## Auth & Onboarding

### 1. New User Signs Up (Email)

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Enters email/pass    → Validate inputs                   →
Clicks "Sign Up"     → supabase.auth.signUp()            →
                     → Supabase sends confirmation email  →
                     → Show "Check your email" message    → authStatus: 'signed_out'
                                                          → profileStatus: 'idle'
```

**Expected UX**: User sees success message, checks email.
**Potential Bug**: User tries to log in before confirming → should show clear error.

---

### 2. New User Confirms Email

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Clicks email link    → Browser opens /login?token=...     →
                     → Supabase processes token           →
                     → getSession() finds valid session   → authStatus: 'initializing' → 'signed_in'
                     → loadUserData() returns no profile  → profileStatus: 'idle' → 'loading' → 'missing'
                     → ProtectedRoute redirects           → Navigate to /create-profile
```

**Expected UX**: Seamless redirect to profile creation.
**Potential Bug**:
- Race condition if onAuthStateChange fires before getSession completes
- Solution: `initialLoadComplete` ref prevents duplicate handling

---

### 3. New User Logs In (First Time After Confirm)

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Enters email/pass    → Validate inputs                    →
Clicks "Sign In"     → supabase.auth.signInWithPassword() →
                     → onAuthStateChange(SIGNED_IN)       → user: set
                                                          → profileStatus: 'loading' (SYNC!)
                                                          → authStatus: 'signed_in'
                     → loadUserData() runs                → profileStatus: 'missing'
                     → LoginPage sees user, redirects     → Navigate to /home
                     → ProtectedRoute checks profile      → profileStatus: 'missing'
                     → Redirect to /create-profile        → Navigate to /create-profile
```

**Expected UX**: Login → brief loading → profile creation page.
**Critical Fix Applied**: `setProfileStatus('loading')` happens BEFORE async work to prevent race condition.

---

### 4. New User Creates Profile

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Fills form           → Local state updates                →
Clicks "Complete"    → Validate username                  →
                     → Check username availability        →
                     → supabase.insert(profile)           →
                     → refreshProfile()                   → profileStatus: 'loading'
                     → loadUserData() returns profile     → profile: set
                                                          → profileStatus: 'exists'
                     → Navigate to /home                  →
                     → ProtectedRoute passes              → Render HomePage
```

**Expected UX**: Form submit → brief loading → home page with profile.
**Potential Bug**:
- Username taken after availability check but before insert → handle 23505 error
- Profile already exists (race with another tab) → redirect to home

---

### 5. Returning User Logs In

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Enters email/pass    → Validate inputs                    →
Clicks "Sign In"     → supabase.auth.signInWithPassword() →
                     → onAuthStateChange(SIGNED_IN)       → user: set
                                                          → profileStatus: 'loading' (SYNC!)
                                                          → authStatus: 'signed_in'
                     → loadUserData() runs                → profile: set
                                                          → profileStatus: 'exists'
                     → LoginPage sees user, redirects     → Navigate to /home
                     → ProtectedRoute checks profile      → profileStatus: 'exists' ✓
                     → Render HomePage                    →
```

**Expected UX**: Login → brief loading → home page.
**Time**: ~500-1500ms depending on network.

---

### 6. Returning User Refreshes Page

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Hits F5 / Reload     → App mounts fresh                   → authStatus: 'initializing'
                                                          → profileStatus: 'idle'
                     → initializeAuth() starts            →
                     → getSession() returns session       → user: set, session: set
                     → loadUserData() runs                → profileStatus: 'loading'
                                                          → profile: set
                                                          → profileStatus: 'exists'
                     → setAuthStatus('signed_in')         → authStatus: 'signed_in'
                     → ProtectedRoute passes              → Render current page
```

**Expected UX**: Brief flash of loading spinner → page renders with data.
**Optimization**: Module-level cache (`friendsCache`, `heartsCache`) makes subsequent data fetches instant if < 30s.

---

### 7. Returning User Opens App in New Tab

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Opens new tab to /   → App mounts fresh                   → authStatus: 'initializing'
                                                          → profileStatus: 'idle'
                     → Same flow as refresh               →
                     → Session cookie shared across tabs  → User logged in
                     → Cache is per-window (module-level) → Fresh fetch required
```

**Expected UX**: Same as refresh - loading spinner then content.
**Note**: Each tab has its own module-level cache. No cross-tab state sync.

---

## Core Usage

### 8. User Opens Home

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Navigates to /home   → ProtectedRoute checks              →
                     → HomePage mounts                    →
                     → useHearts(userId) runs             → Check heartsCache
                       - If fresh cache: instant          →   stats: from cache, loading: false
                       - If stale/empty: fetch            →   loading: true → fetch → loading: false
                     → useFriends(userId) runs            → Check friendsCache
                       - Same cache logic                 →
                     → useCalls(userId) runs              → Syncs to Zustand store
                     → Render with data                   →
```

**Expected UX**:
- First load: spinner → data
- Cached: instant render, background refresh if stale

---

### 9. User Sends a Heart

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Clicks heart button  → Optimistic update                  → friend.can_send_heart: false
                     → Update friendsCache                → Cache updated
                     → incrementSentToday()               → stats.sent_today: +1
                     → supabase.rpc('send_heart')         →
                     → Parse response code                →
                       - SUCCESS: keep optimistic state   → (no rollback)
                       - ERROR: rollback                  → friend.can_send_heart: true
                                                          → stats.sent_today: -1
```

**Expected UX**: Instant UI feedback, button changes to "Sent".
**Error Handling**: Rollback on failure, show toast/error.

---

### 10. User Navigates Home → Friends → Home Quickly

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
On /home             → friendsCache populated             → lastFetchedAt: now
Clicks "Friends"     → Navigate to /friends               →
                     → FriendsPage mounts                 →
                     → useFriends checks cache            → hasFreshCache: true
                     → Initialize from cache (no fetch)   → friends: from cache
                                                          → loading: false (instant!)
Clicks "Back"        → Navigate to /home                  →
                     → HomePage mounts                    →
                     → Same cache logic                   → Instant render
```

**Expected UX**: Zero loading spinners if navigating within 30 seconds.
**Key Pattern**: Module-level cache survives component unmount/remount.

---

### 11. User Switches Tabs and Comes Back

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Switches to other tab → document.visibilityState: 'hidden' →
(time passes)        → ...                                →
Switches back        → document.visibilityState: 'visible' →
                     → visibilitychange event fires       →
                     → loadFriends() called               →
                       - Stale-time check inside          →
                       - If < 30s: skip fetch             → (nothing happens)
                       - If > 30s: background fetch       → (no loading state change)
                     → loadHearts() called                → Same logic
```

**Expected UX**: Data refreshes silently in background if stale. No spinner.

---

### 12. User Opens Friend Profile Modal

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Clicks friend row    → handleFriendClick(friend)          → selectedFriend: friend
                     → FriendProfileModal renders         →
                     → Displays friend data from list     → (no additional fetch)
Clicks close/outside → handleCloseModal()                 → selectedFriend: null
                     → Modal unmounts                     →
```

**Expected UX**: Instant modal open (data already in memory).
**Note**: No additional network request - uses friend data from list.

---

### 13. User Toggles a Call Date

```
User Action          → System Response                    → State Changes
─────────────────────────────────────────────────────────────────────────
Clicks date cell     → Toggle logic determines action     →
                       - Date not in callDates: add       →
                       - Date in callDates: remove        →
                     → Optimistic update to Zustand       → callDates: updated Set
                     → supabase.insert/delete             →
                     → Success: state already correct     →
                     → Error: rollback Zustand            → callDates: previous
```

**Expected UX**: Instant visual toggle, persists on success.

---

## Edge Contexts (Bug Hunting Ground)

### 14. Slow Network (2-5 second delays)

```
Scenario             → Expected Behavior                  → Watch For
─────────────────────────────────────────────────────────────────────────
Login on slow network → Loading spinner visible           → Spinner should appear
                      → Button shows "Signing in..."      → Button should disable
                      → Eventually succeeds/fails         → Timeout handling?

Profile load slow     → "Loading profile..." shown        → User shouldn't see
                      → Wait for completion               →   /create-profile flash

Heart send slow       → Button shows "Sent" immediately   → Optimistic update works
                      → Background request completes      → Rollback if fails
```

**Bug Risk**: Race conditions more visible with delays. Ensure loading states are set SYNCHRONOUSLY before async work.

---

### 15. Network Failure

```
Scenario             → Expected Behavior                  → State Handling
─────────────────────────────────────────────────────────────────────────
Login fails          → Error message displayed            → authStatus: 'signed_out'
                     → User can retry                     → Form stays filled

Profile fetch fails  → Treat as no profile (fallback)    → profileStatus: 'missing'
                     → User sent to /create-profile      → May create duplicate concern

Friends fetch fails  → Error state set                    → error: message
                     → Show error UI                      → loading: false

Heart send fails     → Rollback optimistic update         → can_send_heart: true
                     → Show error toast                   → sent_today: -1
```

**Bug Risk**: Silent failures. Ensure all error paths set appropriate state.

---

### 16. App Opened from Notification / Deep Link

```
Scenario             → System Behavior                    → State Handling
─────────────────────────────────────────────────────────────────────────
Open /friends link   → App mounts fresh                   → authStatus: 'initializing'
(user is logged in)  → getSession() finds session         → authStatus: 'signed_in'
                     → Profile loads                      → profileStatus: 'exists'
                     → ProtectedRoute passes              → Render FriendsPage
                     → useFriends fetches data            → Fresh fetch (no cache)

Open /friends link   → App mounts fresh                   → authStatus: 'initializing'
(user not logged in) → getSession() returns null          → authStatus: 'signed_out'
                     → ProtectedRoute redirects           → Navigate to /login
                     → Return URL should be preserved     → (TODO: implement?)
```

**Bug Risk**: Deep link to protected route while logged out should remember intended destination.

---

### 17. Session Expired

```
Scenario             → System Behavior                    → State Handling
─────────────────────────────────────────────────────────────────────────
Token expires while  → onAuthStateChange fires            →
user is on page      → Event: TOKEN_REFRESHED or         →
                       SIGNED_OUT                         →
                     → If refresh succeeds:               → loadUserData() in background
                     → If refresh fails:                  → authStatus: 'signed_out'
                                                          → profileStatus: 'idle'
                                                          → Redirect to /login

API call with        → Supabase returns 401               → Should trigger
expired token        → (depends on client config)         →   auth state change
```

**Bug Risk**: User makes action with expired token → confusing error. Should redirect to login gracefully.

---

### 18. Two Tabs Open at Once

```
Scenario             → System Behavior                    → State Handling
─────────────────────────────────────────────────────────────────────────
Tab A: Send heart    → Updates friendsCache in Tab A      → Tab A: can_send_heart: false
Tab B: Still open    → Cache is separate (module-level)   → Tab B: can_send_heart: true (stale)
Tab B: Clicks heart  → supabase.rpc('send_heart')         → Server returns ALREADY_SENT_TODAY
                     → Parse error code                   → Show appropriate message
                     → Rollback optimistic update         → (was already false, no visual change)

Tab A: Login         → Session stored in cookie           →
Tab B: Refresh       → getSession() finds session         → Both tabs logged in

Tab A: Logout        → supabase.auth.signOut()            → Tab A: signed_out
                     → Cookie cleared                     →
Tab B: API call      → Returns 401                        → Tab B should redirect to login
```

**Bug Risk**:
- Stale cache between tabs → server validation handles this
- Logout in one tab → other tab should detect and redirect

---

## State Machine Summary

### AuthStatus Transitions

```
'initializing' ──────────────────────────────┐
       │                                      │
       ├─── session exists ──→ 'signed_in' ──┤
       │                                      │
       └─── no session ──────→ 'signed_out' ─┤
                                              │
'signed_in' ←──── SIGNED_IN event ────────────┤
       │                                      │
       └─── signOut() ───────→ 'signed_out' ──┘
```

### ProfileStatus Transitions

```
'idle' ────────────────────────────────────────┐
  │                                            │
  └─── user signs in ──→ 'loading' ────────────┤
                              │                │
                              ├─ found ──→ 'exists'
                              │                │
                              └─ not found ──→ 'missing'
                                               │
'exists' / 'missing' ←── refreshProfile() ─────┤
                                               │
'exists' / 'missing' ──── signOut() ──→ 'idle' ┘
```

---

## Critical Invariants

1. **Auth loading can NEVER get stuck**: Every code path in `initializeAuth()` transitions to a final state.

2. **Profile redirect requires confirmation**: `ProtectedRoute` ONLY redirects to `/create-profile` when `profileStatus === 'missing'`, never when loading.

3. **Optimistic updates always have rollback**: Every optimistic state change has corresponding rollback on error.

4. **Cache is per-window**: Module-level cache survives component remounts but not page refreshes or new tabs.

5. **Stale-time prevents excessive fetching**: 30-second window where data is considered fresh.

6. **Single source of truth**: AuthContext owns auth/profile state. No duplication in Zustand for auth.
