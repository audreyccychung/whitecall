// Cache manager - centralized cache clearing for logout
// Prevents "see someone else's data" bug after logout → login as different user

import { clearFriendsCache } from '../hooks/useFriends';
import { clearHeartsCache } from '../hooks/useHearts';
import { clearRatingsCache } from '../hooks/useCallRatings';

/**
 * Clear all module-level caches.
 * Call this on logout to prevent data leakage between user sessions.
 */
export function clearAllCaches() {
  clearFriendsCache();
  clearHeartsCache();
  clearRatingsCache();
}
