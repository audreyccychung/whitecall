// Tabbed insights section: Trends (sleep + ratings) and Patterns (frequency + day of week + support)
import { useState, useMemo } from 'react';
import type { ProfileStats } from '../../hooks/useProfileStats';
import { computeShareInsights, type SharePeriod } from '../../hooks/useProfileStats';
import type { Call, CallRating } from '../../types/database';
import type { HeartWithSender } from '../../types/heart';
import { useShareCard } from '../../hooks/useShareCard';
import { ShareButton, SharePreviewModal, InsightsShareCard } from '../share';
import { SleepSparkline } from './SleepSparkline';
import { RatingBreakdown } from './RatingBreakdown';
import { CallFrequency } from './CallFrequency';
import { DayOfWeekChart } from './DayOfWeekChart';
import { SupportSummary } from './SupportSummary';

interface InsightsSectionProps {
  stats: ProfileStats;
  currentStreak: number;
  longestStreak: number;
  // Raw data for period-filtered share cards
  calls: Call[];
  ratings: CallRating[];
  heartsReceived: HeartWithSender[];
}

type Tab = 'trends' | 'patterns';

const PERIOD_OPTIONS: { value: SharePeriod; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'all_time', label: 'All Time' },
];

export function InsightsSection({ stats, currentStreak, longestStreak, calls, ratings, heartsReceived }: InsightsSectionProps) {
  const [tab, setTab] = useState<Tab>('trends');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePeriod, setSharePeriod] = useState<SharePeriod>('all_time');
  const insightsShare = useShareCard();

  // Compute stats for the selected share period
  const shareStats = useMemo(
    () => computeShareInsights(calls, ratings, heartsReceived, sharePeriod),
    [calls, ratings, heartsReceived, sharePeriod]
  );

  const handleShare = async () => {
    await insightsShare.generateAndShare();
    setShowShareModal(false);
  };

  return (
    <>
    <div className="bg-white rounded-2xl shadow-soft-lg p-5">
      {/* Header + Share + Tab toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-500">Insights</h3>
          <ShareButton onClick={() => setShowShareModal(true)} />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('trends')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              tab === 'trends'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setTab('patterns')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              tab === 'patterns'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Patterns
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'trends' ? (
        <div className="space-y-5">
          <SleepSparkline data={stats.sleepTrend} avgSleep={stats.allTimeSleepAvg} />
          <RatingBreakdown distribution={stats.ratingDistribution} />
        </div>
      ) : (
        <div className="space-y-5">
          <CallFrequency
            avgGapDays={stats.avgGapDays}
            callsThisMonth={stats.callsThisMonth}
            lastMonthCalls={stats.lastMonthCalls}
            totalCalls={stats.totalCalls}
          />
          <DayOfWeekChart callsByDay={stats.callsByDayOfWeek} />
          <SupportSummary
            allTimeHearts={stats.allTimeHeartsReceived}
            callsWithHeartsPercent={stats.callsWithHeartsPercent}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        </div>
      )}
    </div>

    {/* Share Modal */}
    <SharePreviewModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      onShare={handleShare}
      isGenerating={insightsShare.isGenerating}
    >
      {/* Period selector above the card */}
      <div style={{ marginBottom: '16px' }}>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 justify-center">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSharePeriod(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                sharePeriod === opt.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <InsightsShareCard
        ref={insightsShare.cardRef}
        sleepTrend={shareStats.sleepTrend}
        allTimeSleepAvg={shareStats.allTimeSleepAvg}
        ratingDistribution={shareStats.ratingDistribution}
        avgGapDays={shareStats.avgGapDays}
        totalCalls={shareStats.totalCalls}
        callsByDayOfWeek={shareStats.callsByDayOfWeek}
        allTimeHeartsReceived={shareStats.allTimeHeartsReceived}
        callsWithHeartsPercent={shareStats.callsWithHeartsPercent}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        periodLabel={shareStats.periodLabel}
      />
    </SharePreviewModal>
    </>
  );
}
