// List of past calls with ratings (on-duty shifts only)
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import type { Call, CallRating } from '../types/database';
import { RATING_EMOJI, RATING_LABEL } from '../types/database';
import type { EngagementData } from '../hooks/useCallEngagement';
import { isOnDutyShift } from '../constants/shiftTypes';

interface CallHistoryListProps {
  calls: Call[];
  ratingsMap: Map<string, CallRating>;
  engagementMap?: Map<string, EngagementData>; // call_date -> engagement data
  onRateClick: (callDate: string, existingRating?: CallRating) => void;
  onEngagementClick?: (activityId: string) => void;
  isLoading?: boolean;
}

export function CallHistoryList({
  calls,
  ratingsMap,
  engagementMap,
  onRateClick,
  onEngagementClick,
  isLoading,
}: CallHistoryListProps) {
  // Filter to past on-duty calls only (call/am/pm/night), sorted by date descending
  const pastCalls = useMemo(() => {
    const today = startOfDay(new Date());
    return calls
      .filter((c) => isOnDutyShift(c.shift_type) && isBefore(parseISO(c.call_date), today))
      .sort((a, b) => b.call_date.localeCompare(a.call_date)); // Most recent first
  }, [calls]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Loading history...</p>
      </div>
    );
  }

  if (pastCalls.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-gray-600">No past calls yet</p>
        <p className="text-sm text-gray-500 mt-1">Your call history will appear here</p>
      </div>
    );
  }

  // Handle engagement click (opens engagement modal)
  const handleEngagementClick = (e: React.MouseEvent, activityId: string) => {
    e.stopPropagation(); // Prevent card click (edit rating)
    if (onEngagementClick) {
      onEngagementClick(activityId);
    }
  };

  return (
    <div className="space-y-2">
      {pastCalls.map((call, index) => {
        const rating = ratingsMap.get(call.call_date);
        const hasRating = !!rating;
        const engagement = engagementMap?.get(call.call_date);
        const hasEngagement = engagement && (engagement.like_count > 0 || engagement.comment_count > 0);

        return (
          <motion.button
            key={call.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onRateClick(call.call_date, rating)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              {/* Date badge */}
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold">
                  {format(parseISO(call.call_date), 'd')}
                </span>
              </div>

              {/* Date info */}
              <div>
                <p className="font-medium text-gray-800">
                  {format(parseISO(call.call_date), 'EEEE, MMM d')}
                </p>
                {hasRating ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    <p className="text-sm text-gray-500">
                      {RATING_EMOJI[rating.rating]} {RATING_LABEL[rating.rating]}
                      {rating.hours_slept !== null && ` · 😴 ${rating.hours_slept}h`}
                      {rating.notes && ' · Has notes'}
                    </p>
                    {/* Engagement counts - tappable, separate from card */}
                    {hasEngagement && engagement && (
                      <button
                        onClick={(e) => handleEngagementClick(e, engagement.activity_id)}
                        className="text-sm text-gray-400 hover:text-gray-600 hover:underline ml-1"
                      >
                        {engagement.like_count > 0 && (
                          <span className="text-red-400">❤️ {engagement.like_count}</span>
                        )}
                        {engagement.like_count > 0 && engagement.comment_count > 0 && ' · '}
                        {engagement.comment_count > 0 && (
                          <span className="text-sky-soft-500">💬 {engagement.comment_count}</span>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not rated yet</p>
                )}
              </div>
            </div>

            {/* Action indicator */}
            <div className="flex items-center gap-2">
              {hasRating ? (
                <span className="text-2xl">{RATING_EMOJI[rating.rating]}</span>
              ) : (
                <span className="text-sm text-sky-soft-600 font-medium">Rate</span>
              )}
              <span className="text-gray-400 text-sm">›</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
