// Profile stats hook - computes derived stats for profile display
import { useMemo } from 'react';
import type { Call, CallRating } from '../types/database';
import type { HeartWithSender } from '../types/heart';
import { RATING_SCORES } from '../constants/ratings';
import { isOnDutyShift } from '../constants/shiftTypes';

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
}

export interface TrendPoint {
  date: string;
  mood: number; // 1-4
  sleep: number | null; // 0-12 or null
  hearts: number; // hearts received on this shift
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
    const totalCalls = calls.filter(c => isOnDutyShift(c.shift_type)).length;

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
    };
  }, [calls, ratings, heartsReceived]);
}
