// Profile stats hook - computes derived stats for profile display
import { useMemo } from 'react';
import type { Call, CallRating } from '../types/database';
import type { HeartWithSender } from '../types/heart';
import { RATING_SCORES } from '../constants/ratings';
import { isOnDutyShift } from '../constants/shiftTypes';

export interface RatingDistribution {
  rough: number;
  okay: number;
  good: number;
  great: number;
}

export interface ProfileStats {
  // Call stats
  totalCalls: number;
  callsThisMonth: number;

  // Rating stats
  ratedCalls: number;
  avgMoodScore: number | null; // 1-4 scale, null if no rated calls

  // Sleep stats
  avgSleep: number | null; // null if no sleep data
  callsWithSleep: number;

  // Heart stats
  totalHeartsReceived: number;
  avgHeartsPerCall: number | null; // hearts received / calls with hearts

  // Trend data (last 7 rated calls, oldest first)
  trendData: TrendPoint[];
  hasTrendData: boolean; // true if >= 3 rated calls

  // --- Insights: Trends tab ---
  sleepTrend: TrendPoint[]; // last 20 rated calls with sleep (for sparkline)
  allTimeSleepAvg: number | null; // all-time average sleep
  ratingDistribution: RatingDistribution; // all-time rating counts

  // --- Insights: Patterns tab ---
  avgGapDays: number | null; // average days between on-duty calls
  lastMonthCalls: number; // on-duty calls last month
  callsByDayOfWeek: number[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] all-time on-duty
  allTimeHeartsReceived: number; // total hearts all-time
  callsWithHeartsPercent: number | null; // % of calls that got >= 1 heart
}

export interface TrendPoint {
  date: string;
  mood: number; // 1-4
  sleep: number | null; // 0-12 or null
  hearts: number; // hearts received on this shift
}


// Shareable insights stats — same fields as ProfileStats insights, but computed for a date range
export interface ShareInsights {
  sleepTrend: TrendPoint[];
  allTimeSleepAvg: number | null;
  ratingDistribution: RatingDistribution;
  avgGapDays: number | null;
  totalCalls: number;
  callsByDayOfWeek: number[];
  allTimeHeartsReceived: number;
  callsWithHeartsPercent: number | null;
  periodLabel: string;
}

export type SharePeriod = 'this_month' | 'last_3_months' | 'all_time';

/**
 * Compute insight stats filtered to a date range (for share cards).
 * Reuses the same computation logic as the main hook but scoped to a period.
 */
export function computeShareInsights(
  calls: Call[],
  ratings: CallRating[],
  heartsReceived: HeartWithSender[],
  period: SharePeriod
): ShareInsights {
  const now = new Date();

  // Determine cutoff date
  let cutoffDate: string | null = null; // null = all time
  let periodLabel = 'All Time';

  if (period === 'this_month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    cutoffDate = `${y}-${m}-01`;
    periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (period === 'last_3_months') {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    cutoffDate = `${y}-${m}-01`;
    const startMonth = d.toLocaleString('default', { month: 'short' });
    const endMonth = now.toLocaleString('default', { month: 'short', year: 'numeric' });
    periodLabel = `${startMonth} – ${endMonth}`;
  }

  const inRange = (dateStr: string) => cutoffDate === null || dateStr >= cutoffDate;

  // Filter data
  const filteredCalls = calls.filter(c => isOnDutyShift(c.shift_type) && inRange(c.call_date));
  const filteredRatings = ratings.filter(r => inRange(r.call_date));
  const filteredHearts = heartsReceived.filter(h => inRange(h.shift_date));

  // Hearts by date
  const heartsByDate = new Map<string, number>();
  filteredHearts.forEach(h => {
    heartsByDate.set(h.shift_date, (heartsByDate.get(h.shift_date) || 0) + 1);
  });

  // Sleep trend (last 20 in range)
  const sortedRatings = [...filteredRatings].sort((a, b) => a.call_date.localeCompare(b.call_date));
  const last20 = sortedRatings.slice(-20);
  const sleepTrend: TrendPoint[] = last20.map(r => ({
    date: r.call_date,
    mood: RATING_SCORES[r.rating],
    sleep: r.hours_slept,
    hearts: heartsByDate.get(r.call_date) || 0,
  }));

  // Sleep average
  let sleepSum = 0;
  let sleepCount = 0;
  filteredRatings.forEach(r => {
    if (r.hours_slept !== null) { sleepSum += r.hours_slept; sleepCount++; }
  });
  const allTimeSleepAvg = sleepCount > 0 ? sleepSum / sleepCount : null;

  // Rating distribution
  const ratingDistribution: RatingDistribution = { rough: 0, okay: 0, good: 0, great: 0 };
  filteredRatings.forEach(r => ratingDistribution[r.rating]++);

  // Avg gap
  const sortedDates = filteredCalls.map(c => c.call_date).sort();
  let avgGapDays: number | null = null;
  if (sortedDates.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      totalGap += (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    }
    avgGapDays = totalGap / (sortedDates.length - 1);
  }

  // Day of week
  const callsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  filteredCalls.forEach(c => {
    const d = new Date(c.call_date + 'T00:00:00');
    const jsDay = d.getDay();
    callsByDayOfWeek[jsDay === 0 ? 6 : jsDay - 1]++;
  });

  // Hearts support %
  const totalCalls = filteredCalls.length;
  const uniqueDatesWithHearts = new Set(filteredHearts.map(h => h.shift_date));
  const callsWithHeartsPercent = totalCalls > 0
    ? (uniqueDatesWithHearts.size / totalCalls) * 100
    : null;

  return {
    sleepTrend,
    allTimeSleepAvg,
    ratingDistribution,
    avgGapDays,
    totalCalls,
    callsByDayOfWeek,
    allTimeHeartsReceived: filteredHearts.length,
    callsWithHeartsPercent,
    periodLabel,
  };
}

export function useProfileStats(
  calls: Call[],
  ratings: CallRating[],
  heartsReceived: HeartWithSender[]
): ProfileStats {
  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Helper: check if a YYYY-MM-DD date string is in the current month
    const isThisMonth = (dateStr: string): boolean => {
      const d = new Date(dateStr + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    // --- Current month filters (all "This Month" stats use these) ---

    // On-duty calls this month (call, am, pm, night only)
    const callsThisMonth = calls.filter(c =>
      isOnDutyShift(c.shift_type) && isThisMonth(c.call_date)
    ).length;

    // Ratings this month only
    const ratingsThisMonth = ratings.filter(r => isThisMonth(r.call_date));
    const ratedCalls = ratingsThisMonth.length;

    let moodSum = 0;
    let sleepSum = 0;
    let callsWithSleep = 0;

    ratingsThisMonth.forEach(r => {
      moodSum += RATING_SCORES[r.rating];
      if (r.hours_slept !== null) {
        sleepSum += r.hours_slept;
        callsWithSleep++;
      }
    });

    const avgMoodScore = ratedCalls > 0 ? moodSum / ratedCalls : null;
    const avgSleep = callsWithSleep > 0 ? sleepSum / callsWithSleep : null;

    // Hearts received this month only
    const heartsThisMonth = heartsReceived.filter(h => isThisMonth(h.shift_date));
    const totalHeartsReceived = heartsThisMonth.length;

    // Count unique shift dates that received hearts this month
    const heartsByDateThisMonth = new Map<string, number>();
    heartsThisMonth.forEach(h => {
      heartsByDateThisMonth.set(h.shift_date, (heartsByDateThisMonth.get(h.shift_date) || 0) + 1);
    });
    const shiftsWithHearts = heartsByDateThisMonth.size;
    const avgHeartsPerCall = shiftsWithHearts > 0
      ? totalHeartsReceived / shiftsWithHearts
      : null;

    // --- All-time data for trend chart (last 7 rated calls, not month-scoped) ---

    // Hearts by date (all-time) for trend chart
    const heartsByDate = new Map<string, number>();
    heartsReceived.forEach(h => {
      heartsByDate.set(h.shift_date, (heartsByDate.get(h.shift_date) || 0) + 1);
    });

    const sortedRatings = [...ratings]
      .sort((a, b) => a.call_date.localeCompare(b.call_date))
      .slice(-7);

    const trendData: TrendPoint[] = sortedRatings.map(r => ({
      date: r.call_date,
      mood: RATING_SCORES[r.rating],
      sleep: r.hours_slept,
      hearts: heartsByDate.get(r.call_date) || 0,
    }));

    // totalCalls = on-duty calls all-time (used by share card)
    const onDutyCalls = calls.filter(c => isOnDutyShift(c.shift_type));
    const totalCalls = onDutyCalls.length;

    // --- Insights: Trends tab ---

    // Sleep trend: last 20 rated calls (for sparkline)
    const allSortedRatings = [...ratings]
      .sort((a, b) => a.call_date.localeCompare(b.call_date));
    const last20 = allSortedRatings.slice(-20);
    const sleepTrend: TrendPoint[] = last20.map(r => ({
      date: r.call_date,
      mood: RATING_SCORES[r.rating],
      sleep: r.hours_slept,
      hearts: heartsByDate.get(r.call_date) || 0,
    }));

    // All-time sleep average
    let allTimeSleepSum = 0;
    let allTimeSleepCount = 0;
    ratings.forEach(r => {
      if (r.hours_slept !== null) {
        allTimeSleepSum += r.hours_slept;
        allTimeSleepCount++;
      }
    });
    const allTimeSleepAvg = allTimeSleepCount > 0 ? allTimeSleepSum / allTimeSleepCount : null;

    // Rating distribution (all-time)
    const ratingDistribution: RatingDistribution = { rough: 0, okay: 0, good: 0, great: 0 };
    ratings.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    // --- Insights: Patterns tab ---

    // Average gap between on-duty calls
    const sortedOnDutyDates = onDutyCalls
      .map(c => c.call_date)
      .sort((a, b) => a.localeCompare(b));

    let avgGapDays: number | null = null;
    if (sortedOnDutyDates.length >= 2) {
      let totalGap = 0;
      for (let i = 1; i < sortedOnDutyDates.length; i++) {
        const prev = new Date(sortedOnDutyDates[i - 1] + 'T00:00:00');
        const curr = new Date(sortedOnDutyDates[i] + 'T00:00:00');
        totalGap += (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      }
      avgGapDays = totalGap / (sortedOnDutyDates.length - 1);
    }

    // Last month call count
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthCalls = calls.filter(c => {
      if (!isOnDutyShift(c.shift_type)) return false;
      const d = new Date(c.call_date + 'T00:00:00');
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    // Calls by day of week (Mon=0 ... Sun=6)
    const callsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    onDutyCalls.forEach(c => {
      const d = new Date(c.call_date + 'T00:00:00');
      const jsDay = d.getDay(); // 0=Sun, 1=Mon, ...
      const idx = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0, Sun=6
      callsByDayOfWeek[idx]++;
    });

    // All-time hearts and support percentage
    const allTimeHeartsReceived = heartsReceived.length;
    const uniqueShiftDatesWithHearts = new Set(heartsReceived.map(h => h.shift_date));
    const callsWithHeartsPercent = totalCalls > 0
      ? (uniqueShiftDatesWithHearts.size / totalCalls) * 100
      : null;

    return {
      totalCalls,
      callsThisMonth,
      ratedCalls,
      avgMoodScore,
      avgSleep,
      callsWithSleep,
      totalHeartsReceived,
      avgHeartsPerCall,
      trendData,
      hasTrendData: ratings.length >= 3,
      // Insights
      sleepTrend,
      allTimeSleepAvg,
      ratingDistribution,
      avgGapDays,
      lastMonthCalls,
      callsByDayOfWeek,
      allTimeHeartsReceived,
      callsWithHeartsPercent,
    };
  }, [calls, ratings, heartsReceived]);
}
