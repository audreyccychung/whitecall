// Tabbed insights section: Trends (sleep + ratings) and Patterns (frequency + day of week + support)
import { useState } from 'react';
import type { ProfileStats } from '../../hooks/useProfileStats';
import { SleepSparkline } from './SleepSparkline';
import { RatingBreakdown } from './RatingBreakdown';
import { CallFrequency } from './CallFrequency';
import { DayOfWeekChart } from './DayOfWeekChart';
import { SupportSummary } from './SupportSummary';

interface InsightsSectionProps {
  stats: ProfileStats;
  currentStreak: number;
  longestStreak: number;
}

type Tab = 'trends' | 'patterns';

export function InsightsSection({ stats, currentStreak, longestStreak }: InsightsSectionProps) {
  const [tab, setTab] = useState<Tab>('trends');

  return (
    <div className="bg-white rounded-2xl shadow-soft-lg p-5">
      {/* Header + Tab toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Insights</h3>
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
  );
}
