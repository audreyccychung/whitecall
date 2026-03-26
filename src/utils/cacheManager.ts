// Cache manager - centralized cache clearing for logout
// Prevents "see someone else's data" bug after logout → login as different user

import { clearFriendsCache } from '../hooks/useFriends';
import { clearHeartsCache } from '../hooks/useHearts';
import { clearRatingsCache } from '../hooks/useCallRatings';
import { clearActivityFeedCache } from '../hooks/useActivityFeed';
import { clearNotificationsCache } from '../hooks/useNotifications';
import { clearEngagementCache } from '../hooks/useCallEngagement';
import { clearCallsCache } from '../hooks/useCalls';

/**
 * Clear all module-level caches.
 * Call this on logout to prevent data leakage between user sessions.
 */
export function clearAllCaches() {
  clearFriendsCache();
  clearHeartsCache();
  clearCallsCache();
  clearRatingsCache();
  clearActivityFeedCache();
  clearNotificationsCache();
  clearEngagementCache();
}
