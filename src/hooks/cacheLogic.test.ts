import { describe, it, expect, beforeEach } from 'vitest';

// Test the cache logic in isolation (without React hooks)
// This validates the core caching decisions

const STALE_TIME_MS = 30_000;

// Simulated cache structure (mirrors useFriends/useHearts)
interface FriendsCache {
  data: { id: string; can_send_heart: boolean }[];
  lastFetchedAt: number;
  userId: string | null;
}

// Helper to simulate cache check logic
function shouldShowSpinner(
  cache: FriendsCache,
  userId: string | undefined
): boolean {
  // This is the NEW logic (hasCachedData)
  const hasCachedData =
    userId &&
    cache.userId === userId &&
    cache.data.length > 0;

  return !hasCachedData;
}

function shouldShowSpinnerOLD(
  cache: FriendsCache,
  userId: string | undefined
): boolean {
  // This is the OLD logic (hasFreshCache) - had the bug
  const hasFreshCache =
    userId &&
    cache.userId === userId &&
    Date.now() - cache.lastFetchedAt < STALE_TIME_MS;

  return !hasFreshCache;
}

function shouldForceRefetch(
  prevUserId: string | undefined,
  currentUserId: string | undefined
): boolean {
  return prevUserId !== currentUserId;
}

describe('Cache spinner logic', () => {
  let cache: FriendsCache;

  beforeEach(() => {
    cache = {
      data: [],
      lastFetchedAt: 0,
      userId: null,
    };
  });

  describe('NEW logic (hasCachedData)', () => {
    it('shows spinner when cache is empty', () => {
      cache = { data: [], lastFetchedAt: 0, userId: null };
      expect(shouldShowSpinner(cache, 'user123')).toBe(true);
    });

    it('shows spinner when cache is for different user', () => {
      cache = {
        data: [{ id: '1', can_send_heart: true }],
        lastFetchedAt: Date.now(),
        userId: 'userA',
      };
      expect(shouldShowSpinner(cache, 'userB')).toBe(true);
    });

    it('does NOT show spinner when cache has data for same user (even if stale)', () => {
      const staleTime = Date.now() - 60_000; // 60 seconds ago (stale)
      cache = {
        data: [{ id: '1', can_send_heart: true }],
        lastFetchedAt: staleTime,
        userId: 'user123',
      };
      expect(shouldShowSpinner(cache, 'user123')).toBe(false);
    });

    it('does NOT show spinner when cache has data for same user (fresh)', () => {
      cache = {
        data: [{ id: '1', can_send_heart: true }],
        lastFetchedAt: Date.now(),
        userId: 'user123',
      };
      expect(shouldShowSpinner(cache, 'user123')).toBe(false);
    });

    it('shows spinner when user has no friends (empty data array)', () => {
      cache = {
        data: [],
        lastFetchedAt: Date.now(),
        userId: 'user123',
      };
      // This is expected - empty array means no cached display data
      expect(shouldShowSpinner(cache, 'user123')).toBe(true);
    });
  });

  describe('OLD logic comparison (hasFreshCache) - demonstrates the bug', () => {
    it('OLD: would show spinner for stale cache (BUG)', () => {
      const staleTime = Date.now() - 60_000; // 60 seconds ago
      cache = {
        data: [{ id: '1', can_send_heart: true }],
        lastFetchedAt: staleTime,
        userId: 'user123',
      };
      // OLD logic: stale = show spinner (BAD - causes flicker)
      expect(shouldShowSpinnerOLD(cache, 'user123')).toBe(true);
      // NEW logic: has data = no spinner (GOOD)
      expect(shouldShowSpinner(cache, 'user123')).toBe(false);
    });
  });
});

describe('Force refetch logic', () => {
  it('forces refetch when userId changes (login)', () => {
    expect(shouldForceRefetch(undefined, 'user123')).toBe(true);
  });

  it('forces refetch when userId changes (user switch)', () => {
    expect(shouldForceRefetch('userA', 'userB')).toBe(true);
  });

  it('forces refetch when userId changes (logout)', () => {
    expect(shouldForceRefetch('user123', undefined)).toBe(true);
  });

  it('does NOT force refetch on remount with same user', () => {
    expect(shouldForceRefetch('user123', 'user123')).toBe(false);
  });
});

describe('Optimistic update preservation', () => {
  it('optimistic update survives when stale-time prevents refetch', () => {
    const cache: FriendsCache = {
      data: [
        { id: 'friend1', can_send_heart: true },
        { id: 'friend2', can_send_heart: true },
      ],
      lastFetchedAt: Date.now() - 10_000, // 10 seconds ago (fresh)
      userId: 'user123',
    };

    // Simulate optimistic update
    cache.data = cache.data.map(f =>
      f.id === 'friend1' ? { ...f, can_send_heart: false } : f
    );

    // Simulate remount - check if we would skip refetch
    const timeSinceLastFetch = Date.now() - cache.lastFetchedAt;
    const shouldSkipRefetch = timeSinceLastFetch < STALE_TIME_MS;

    expect(shouldSkipRefetch).toBe(true);
    expect(cache.data.find(f => f.id === 'friend1')?.can_send_heart).toBe(false);
  });

  it('optimistic update lost when stale-time expires', () => {
    const cache: FriendsCache = {
      data: [
        { id: 'friend1', can_send_heart: false }, // Optimistic update applied
      ],
      lastFetchedAt: Date.now() - 40_000, // 40 seconds ago (stale)
      userId: 'user123',
    };

    // On remount after stale-time, refetch WILL happen
    const timeSinceLastFetch = Date.now() - cache.lastFetchedAt;
    const shouldSkipRefetch = timeSinceLastFetch < STALE_TIME_MS;

    expect(shouldSkipRefetch).toBe(false);
    // Note: This is expected behavior - after 30s, we accept fresh data from server
    // The heart should be in DB by then anyway
  });
});

describe('Empty friends edge case', () => {
  it('cache should be updated even when friends list is empty', () => {
    const cache: FriendsCache = {
      data: [],
      lastFetchedAt: 0,
      userId: null,
    };

    // Simulate loadFriends completing with empty result
    // (This is the fix we added)
    cache.data = [];
    cache.lastFetchedAt = Date.now();
    cache.userId = 'user123';

    // Now on remount, stale-time should prevent repeated fetches
    const timeSinceLastFetch = Date.now() - cache.lastFetchedAt;
    const shouldSkipRefetch = timeSinceLastFetch < STALE_TIME_MS;

    expect(shouldSkipRefetch).toBe(true);
    expect(cache.lastFetchedAt).toBeGreaterThan(0);
  });
});

describe('Hearts cache edge cases', () => {
  interface HeartsCache {
    stats: { sent_today: number; received_today: number };
    lastFetchedAt: number;
    userId: string | null;
  }

  function shouldShowHeartsSpinner(
    cache: HeartsCache,
    userId: string | undefined
  ): boolean {
    const hasCachedData =
      userId &&
      cache.userId === userId &&
      cache.lastFetchedAt > 0;

    return !hasCachedData;
  }

  it('shows spinner on first load (no cache)', () => {
    const cache: HeartsCache = {
      stats: { sent_today: 0, received_today: 0 },
      lastFetchedAt: 0,
      userId: null,
    };
    expect(shouldShowHeartsSpinner(cache, 'user123')).toBe(true);
  });

  it('does NOT show spinner when cache exists (even with zero hearts)', () => {
    const cache: HeartsCache = {
      stats: { sent_today: 0, received_today: 0 },
      lastFetchedAt: Date.now() - 60_000, // stale
      userId: 'user123',
    };
    // Key: lastFetchedAt > 0 means we've fetched before
    expect(shouldShowHeartsSpinner(cache, 'user123')).toBe(false);
  });

  it('optimistic increment updates cache', () => {
    const cache: HeartsCache = {
      stats: { sent_today: 2, received_today: 5 },
      lastFetchedAt: Date.now(),
      userId: 'user123',
    };

    // Simulate incrementSentToday
    cache.stats = { ...cache.stats, sent_today: cache.stats.sent_today + 1 };

    expect(cache.stats.sent_today).toBe(3);
  });

  it('optimistic decrement (rollback) updates cache', () => {
    const cache: HeartsCache = {
      stats: { sent_today: 3, received_today: 5 },
      lastFetchedAt: Date.now(),
      userId: 'user123',
    };

    // Simulate decrementSentToday
    cache.stats = {
      ...cache.stats,
      sent_today: Math.max(0, cache.stats.sent_today - 1)
    };

    expect(cache.stats.sent_today).toBe(2);
  });

  it('decrement does not go below zero', () => {
    const cache: HeartsCache = {
      stats: { sent_today: 0, received_today: 5 },
      lastFetchedAt: Date.now(),
      userId: 'user123',
    };

    // Simulate decrementSentToday when already at 0
    cache.stats = {
      ...cache.stats,
      sent_today: Math.max(0, cache.stats.sent_today - 1)
    };

    expect(cache.stats.sent_today).toBe(0);
  });
});
