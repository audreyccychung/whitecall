// Profile stats hook - computes derived stats for profile display
import { useMemo } from 'react';
import type { Call, CallRating } from '../types/database';
import type { HeartWithSender } from '../types/heart';
import { RATING_SCORES } from '../constants/ratings';

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

    // Create lookup maps
    const ratingsMap = new Map<string, CallRating>();
    ratings.forEach(r => ratingsMap.set(r.call_date, r));

    // Count hearts by shift date
    const heartsByDate = new Map<string, number>();
    heartsReceived.forEach(h => {
      heartsByDate.set(h.shift_date, (heartsByDate.get(h.shift_date) || 0) + 1);
    });

    // Basic call stats
    const totalCalls = calls.length;
    const callsThisMonth = calls.filter(c => {
      const d = new Date(c.call_date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Rating stats
    const ratedCalls = ratings.length;
    let moodSum = 0;
    let sleepSum = 0;
    let callsWithSleep = 0;

    ratings.forEach(r => {
      moodSum += RATING_SCORES[r.rating];
      if (r.hours_slept !== null) {
        sleepSum += r.hours_slept;
        callsWithSleep++;
      }
    });

    const avgMoodScore = ratedCalls > 0 ? moodSum / ratedCalls : null;
    const avgSleep = callsWithSleep > 0 ? sleepSum / callsWithSleep : null;

    // Heart stats
    const totalHeartsReceived = heartsReceived.length;
    // Count unique shift dates that received hearts
    const shiftsWithHearts = heartsByDate.size;
    const avgHeartsPerCall = shiftsWithHearts > 0
      ? totalHeartsReceived / shiftsWithHearts
      : null;

    // Build trend data from last 7 rated calls (sorted oldest to newest for chart)
    const sortedRatings = [...ratings]
      .sort((a, b) => a.call_date.localeCompare(b.call_date))
      .slice(-7);

    const trendData: TrendPoint[] = sortedRatings.map(r => ({
      date: r.call_date,
      mood: RATING_SCORES[r.rating],
      sleep: r.hours_slept,
      hearts: heartsByDate.get(r.call_date) || 0,
    }));

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
      hasTrendData: ratedCalls >= 3,
    };
  }, [calls, ratings, heartsReceived]);
}
