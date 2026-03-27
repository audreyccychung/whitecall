// Pull-to-refresh hook using vanilla touch events
// Attaches to document — works with pages that scroll the whole window (no inner scroll div)
import { useState, useEffect, useRef, useCallback } from 'react';

const PULL_THRESHOLD_PX = 60; // How far user must pull before refresh triggers
const MAX_PULL_PX = 90;       // Visual cap so the spinner doesn't travel too far

export interface UsePullToRefreshResult {
  isRefreshing: boolean;
  pullDistance: number; // 0–MAX_PULL_PX, for animating the indicator
}

export function usePullToRefresh(onRefresh: () => Promise<void>): UsePullToRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Refs so touch handlers always see current values without needing re-registration
  const startYRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  // Store onRefresh in a ref so handleTouchEnd doesn't need it in deps
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start tracking if we are scrolled to the very top
    if (window.scrollY !== 0) return;
    if (isRefreshingRef.current) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null) return;
    if (isRefreshingRef.current) return;

    // If user has scrolled away from top while dragging, cancel
    if (window.scrollY !== 0) {
      startYRef.current = null;
      setPullDistance(0);
      pullDistanceRef.current = 0;
      return;
    }

    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;

    // Only track downward pulls
    if (delta <= 0) {
      setPullDistance(0);
      pullDistanceRef.current = 0;
      return;
    }

    // Apply resistance so the pull feels physical (sqrt scaling)
    // This makes it harder to pull past the threshold
    const capped = Math.min(MAX_PULL_PX, Math.sqrt(delta) * 6);
    setPullDistance(capped);
    pullDistanceRef.current = capped;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (isRefreshingRef.current) return;

    // Check raw pull distance against threshold
    if (pullDistanceRef.current >= PULL_THRESHOLD_PX) {
      // Snap to threshold position and hold while refreshing
      setPullDistance(PULL_THRESHOLD_PX);
      pullDistanceRef.current = PULL_THRESHOLD_PX;
      isRefreshingRef.current = true;
      setIsRefreshing(true);

      onRefreshRef.current().finally(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      });
    } else {
      // Did not pull far enough — snap back
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing, pullDistance };
}
