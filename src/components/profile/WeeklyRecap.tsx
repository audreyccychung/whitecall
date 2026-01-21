// Weekly recap card - simple static summary
import { useMemo } from 'react';
import type { Call, CallRating, CallRatingValue } from '../../types/database';
import type { HeartWithSender } from '../../types/heart';

interface WeeklyRecapProps {
  calls: Call[];
  ratings: CallRating[];
  heartsReceived: HeartWithSender[];
}

const RATING_SCORES: Record<CallRatingValue, number> = {
  rough: 1,
  okay: 2,
  good: 3,
  great: 4,
};

export function WeeklyRecap({ calls, ratings, heartsReceived }: WeeklyRecapProps) {
  const weekStats = useMemo(() => {
    // Get dates for last 7 days
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Filter to last 7 days
    const weekCalls = calls.filter((c) => c.call_date >= weekAgoStr);
    const weekRatings = ratings.filter((r) => r.call_date >= weekAgoStr);
    const weekHearts = heartsReceived.filter((h) => h.shift_date >= weekAgoStr);

    // Calculate avg mood
    let avgMood: number | null = null;
    if (weekRatings.length > 0) {
      const sum = weekRatings.reduce((acc, r) => acc + RATING_SCORES[r.rating], 0);
      avgMood = sum / weekRatings.length;
    }

    return {
      callCount: weekCalls.length,
      heartsReceived: weekHearts.length,
      avgMood,
    };
  }, [calls, ratings, heartsReceived]);

  // Don't show if no activity
  if (weekStats.callCount === 0 && weekStats.heartsReceived === 0) {
    return null;
  }

  // Get mood emoji
  const getMoodEmoji = (score: number | null) => {
    if (score === null) return null;
    if (score >= 3.5) return '✨';
    if (score >= 2.5) return '😊';
    if (score >= 1.5) return '😐';
    return '😫';
  };

  const moodEmoji = getMoodEmoji(weekStats.avgMood);

  return (
    <div className="bg-gradient-to-br from-sky-soft-50 to-pink-50 rounded-2xl shadow-soft-lg p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        This Week
      </h3>

      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Calls */}
        <div>
          <p className="text-2xl font-bold text-gray-800">{weekStats.callCount}</p>
          <p className="text-xs text-gray-500">{weekStats.callCount === 1 ? 'Call' : 'Calls'}</p>
        </div>

        {/* Hearts Received */}
        <div>
          <p className="text-2xl font-bold text-gray-800">{weekStats.heartsReceived}</p>
          <p className="text-xs text-gray-500">Hearts Received</p>
        </div>

        {/* Avg Mood */}
        <div>
          <p className="text-2xl">{moodEmoji || '-'}</p>
          <p className="text-xs text-gray-500">Avg Mood</p>
        </div>
      </div>
    </div>
  );
}
