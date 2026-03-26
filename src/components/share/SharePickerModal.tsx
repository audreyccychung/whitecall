// Unified share modal — swipe between different share card types
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShareCard } from '../../hooks/useShareCard';
import { computeShareInsights, type SharePeriod } from '../../hooks/useProfileStats';
import type { ProfileStats } from '../../hooks/useProfileStats';
import type { Call, CallRating } from '../../types/database';
import type { HeartWithSender } from '../../types/heart';
import { MonthlyShareCard } from './cards/MonthlyShareCard';
import { InsightsShareCard } from './cards/InsightsShareCard';
import { StreakShareCard } from './cards/StreakShareCard';

type CardType = 'monthly' | 'insights' | 'streak';

interface SharePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Data for cards
  month: string;
  stats: ProfileStats;
  currentStreak: number;
  longestStreak: number;
  calls: Call[];
  ratings: CallRating[];
  heartsReceived: HeartWithSender[];
}

const CARD_OPTIONS: { value: CardType; label: string; emoji: string }[] = [
  { value: 'monthly', label: 'Monthly', emoji: '📅' },
  { value: 'insights', label: 'Insights', emoji: '📊' },
  { value: 'streak', label: 'Streak', emoji: '🔥' },
];

const PERIOD_OPTIONS: { value: SharePeriod; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'all_time', label: 'All Time' },
];

export function SharePickerModal({
  isOpen,
  onClose,
  month,
  stats,
  currentStreak,
  longestStreak,
  calls,
  ratings,
  heartsReceived,
}: SharePickerModalProps) {
  const [activeCard, setActiveCard] = useState<CardType>('monthly');
  const [insightsPeriod, setInsightsPeriod] = useState<SharePeriod>('all_time');
  const shareCard = useShareCard();

  const shareInsights = useMemo(
    () => computeShareInsights(calls, ratings, heartsReceived, insightsPeriod),
    [calls, ratings, heartsReceived, insightsPeriod]
  );

  const handleShare = async () => {
    await shareCard.generateAndShare();
  };

  // Swipe navigation
  const cardTypes: CardType[] = ['monthly', 'insights', 'streak'];
  const activeIdx = cardTypes.indexOf(activeCard);

  const handleSwipe = (direction: number) => {
    const next = activeIdx + direction;
    if (next >= 0 && next < cardTypes.length) {
      setActiveCard(cardTypes[next]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md"
          >
            <div className="bg-white rounded-t-3xl p-6 shadow-xl modal-safe-bottom sm:pb-6">
              {/* Card type selector — pill tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
                {CARD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActiveCard(opt.value)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      activeCard === opt.value
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Period selector (insights only) */}
              {activeCard === 'insights' && (
                <div className="flex gap-1 bg-gray-50 rounded-lg p-1 mb-4 justify-center">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setInsightsPeriod(opt.value)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        insightsPeriod === opt.value
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Card preview — swipeable */}
              <div className="mb-5">
                <motion.div
                  key={activeCard + insightsPeriod}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.3}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) handleSwipe(1);
                    if (info.offset.x > 60) handleSwipe(-1);
                  }}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="relative mx-auto overflow-hidden rounded-2xl shadow-lg bg-gray-100"
                    style={{ width: '220px', height: '391px' }}
                  >
                    <div
                      style={{
                        transform: 'scale(0.203703)',
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    >
                      {activeCard === 'monthly' && (
                        <MonthlyShareCard
                          ref={shareCard.cardRef}
                          month={month}
                          calls={stats.callsThisMonth}
                          avgSleep={stats.avgSleep}
                          heartsReceived={stats.totalHeartsReceived}
                          currentStreak={currentStreak}
                        />
                      )}
                      {activeCard === 'insights' && (
                        <InsightsShareCard
                          ref={shareCard.cardRef}
                          sleepTrend={shareInsights.sleepTrend}
                          allTimeSleepAvg={shareInsights.allTimeSleepAvg}
                          ratingDistribution={shareInsights.ratingDistribution}
                          avgGapDays={shareInsights.avgGapDays}
                          totalCalls={shareInsights.totalCalls}
                          callsByDayOfWeek={shareInsights.callsByDayOfWeek}
                          allTimeHeartsReceived={shareInsights.allTimeHeartsReceived}
                          callsWithHeartsPercent={shareInsights.callsWithHeartsPercent}
                          currentStreak={currentStreak}
                          longestStreak={longestStreak}
                          periodLabel={shareInsights.periodLabel}
                        />
                      )}
                      {activeCard === 'streak' && (
                        <StreakShareCard
                          ref={shareCard.cardRef}
                          streakDays={currentStreak}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-1.5 mt-3">
                  {cardTypes.map((type, i) => (
                    <div
                      key={type}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === activeIdx ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium transition-colors hover:bg-gray-200 active:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={shareCard.isGenerating}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-500 text-white font-medium transition-colors hover:bg-sky-600 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shareCard.isGenerating ? 'Generating...' : 'Share'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
