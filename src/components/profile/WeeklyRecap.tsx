// Weekly recap card - simple static summary
import { useMemo, useState } from 'react';
import type { Call, CallRating } from '../../types/database';
import type { HeartWithSender } from '../../types/heart';
import { ShareButton, SharePreviewModal, WeeklyShareCard } from '../share';
import { useShareCard } from '../../hooks/useShareCard';
import { formatStat, getStatLabel, type StatKey } from '../../utils/statsRegistry';
import { RATING_SCORES } from '../../constants/ratings';

// Stats displayed in the UI card (intentionally different from share card)
const WEEKLY_RECAP_STATS: StatKey[] = ['calls', 'heartsReceived', 'avgMood'];

interface WeeklyRecapProps {
  calls: Call[];
  ratings: CallRating[];
  heartsReceived: HeartWithSender[];
}

export function WeeklyRecap({ calls, ratings, heartsReceived }: WeeklyRecapProps) {
  const [showPreview, setShowPreview] = useState(false);
  const shareCard = useShareCard();
  const { cardRef, isGenerating, generateAndShare } = shareCard;

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

  // Map stat keys to values for formatting
  const statValues: Record<StatKey, number | null> = {
    calls: weekStats.callCount,
    heartsReceived: weekStats.heartsReceived,
    avgMood: weekStats.avgMood,
    avgSleep: null,
    avgSupport: null,
    streak: null,
  };

  const handleShare = async () => {
    await generateAndShare();
    setShowPreview(false);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-sky-soft-50 to-pink-50 rounded-2xl shadow-soft-lg p-5 relative">
        {/* Share button */}
        <div className="absolute top-3 right-3">
          <ShareButton onClick={() => setShowPreview(true)} />
        </div>

        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          This Week
        </h3>

      <div className="grid grid-cols-3 gap-4 text-center">
        {WEEKLY_RECAP_STATS.map((statKey) => (
          <div key={statKey}>
            <p className={`text-2xl ${statKey === 'avgMood' ? '' : 'font-bold text-gray-800'}`}>
              {formatStat(statKey, statValues[statKey])}
            </p>
            <p className="text-xs text-gray-500">{getStatLabel(statKey)}</p>
          </div>
        ))}
      </div>
    </div>

      {/* Share preview modal */}
      <SharePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onShare={handleShare}
        isGenerating={isGenerating}
      >
        <WeeklyShareCard
          ref={cardRef}
          calls={weekStats.callCount}
          avgSleep={null}
          heartsReceived={weekStats.heartsReceived}
          avgMood={weekStats.avgMood}
        />
      </SharePreviewModal>
    </>
  );
}
