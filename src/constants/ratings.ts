// Rating constants - single source of truth for mood scoring
// Used by useProfileStats and WeeklyRecap for consistent calculations

import type { CallRatingValue } from '../types/database';

/**
 * Maps rating values to numeric scores for mood calculations.
 * Scale: 1 (rough) to 4 (great)
 */
export const RATING_SCORES: Record<CallRatingValue, number> = {
  rough: 1,
  okay: 2,
  good: 3,
  great: 4,
};
