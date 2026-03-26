// Profile page - identity + reflection, not admin analytics
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCalls } from '../hooks/useCalls';
import { useCallRatings } from '../hooks/useCallRatings';
import { useCallEngagement } from '../hooks/useCallEngagement';
import { useHearts } from '../hooks/useHearts';
import { useProfileStats } from '../hooks/useProfileStats';
import { useBadges } from '../hooks/useBadges';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { MoodCircle } from '../components/MoodCircle';
import { StatCard } from '../components/profile/StatCard';
import { CallTimeline } from '../components/profile/CallTimeline';
import { InsightsSection } from '../components/profile/InsightsSection';
import { FriendsSection } from '../components/profile/FriendsSection';
import { CallHistoryList } from '../components/CallHistoryList';
import { RateCallModal } from '../components/RateCallModal';
import { EngagementModal } from '../components/EngagementModal';
import { SharePickerModal } from '../components/share';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { formatStat, getStatLabel, type StatKey } from '../utils/statsRegistry';
import type { CallRating } from '../types/database';

// Stats displayed in the monthly UI section (intentionally different from share card)
const MONTHLY_UI_STATS: StatKey[] = ['calls', 'avgMood', 'avgSleep', 'avgSupport'];

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { calls, loading: callsLoading, refreshCalls } = useCalls(user?.id);
  const { ratings, ratingsMap, isLoading: ratingsLoading, refetch: refetchRatings } = useCallRatings(user?.id);
  const { engagementMap, isLoading: engagementLoading } = useCallEngagement(user?.id);
  const { heartsReceived, stats: heartStats, loading: heartsLoading, refreshHearts } = useHearts(user?.id);

  // Compute stats
  const stats = useProfileStats(calls, ratings, heartsReceived);

  // Compute badges from profile data
  const badges = useBadges({
    totalHeartsSent: heartStats.total_sent,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
  });

  // Modal state for rating
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    callDate: string;
    existingRating?: CallRating;
  }>({ isOpen: false, callDate: '' });

  // Unified share modal
  const [showSharePicker, setShowSharePicker] = useState(false);

  // Engagement modal state (for viewing likers + comments on own activity)
  const [selectedActivityForEngagement, setSelectedActivityForEngagement] = useState<string | null>(null);

  // Handle click on call in history list
  const handleHistoryItemClick = (callDate: string, existingRating?: CallRating) => {
    setRatingModal({ isOpen: true, callDate, existingRating });
  };

  // Close modal
  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, callDate: '' });
  };

  // Pull-to-refresh: force-refetch calls, ratings, and hearts from the server
  const handleRefresh = async (): Promise<void> => {
    await Promise.all([
      refreshCalls(),
      refetchRatings(),
      refreshHearts({ force: true }),
    ]);
  };

  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
        <header className="bg-white shadow-soft">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
            <div className="h-7 w-20 animate-pulse bg-gray-200 rounded" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {/* Hero card skeleton */}
          <div className="bg-white rounded-2xl shadow-soft-lg p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 animate-pulse bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 animate-pulse bg-gray-200 rounded" />
                <div className="h-3.5 w-20 animate-pulse bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-soft p-3 flex flex-col items-center gap-2">
                <div className="h-6 w-10 animate-pulse bg-gray-200 rounded" />
                <div className="h-3 w-14 animate-pulse bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          {/* Call history skeleton */}
          <div className="bg-white rounded-2xl shadow-soft-lg p-5 space-y-2">
            <div className="h-5 w-24 animate-pulse bg-gray-200 rounded mb-4" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="space-y-1.5">
                  <div className="h-4 w-36 animate-pulse bg-gray-200 rounded" />
                  <div className="h-3 w-24 animate-pulse bg-gray-200 rounded" />
                </div>
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const isLoading = callsLoading || ratingsLoading || engagementLoading || heartsLoading;

  // Map stat keys to values for formatting
  const statValues: Record<StatKey, number | null> = {
    calls: stats.callsThisMonth,
    heartsReceived: stats.totalHeartsReceived,
    avgMood: stats.avgMoodScore,
    avgSleep: stats.avgSleep,
    avgSupport: stats.avgHeartsPerCall,
    streak: profile.current_streak ?? 0,
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Hero Section - Identity only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft-lg p-5"
        >
          <div className="flex items-center gap-4">
            {/* Avatar with settings button overlay */}
            <div className="relative flex-shrink-0">
              <AvatarDisplay
                avatarType={profile.avatar_type}
                avatarColor={profile.avatar_color}
                avatarUrl={profile?.avatar_url}
                size="medium"
              />
              {/* Settings button - bottom right of avatar */}
              <Link
                to="/settings"
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
                aria-label="Settings"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 truncate">
                {profile.display_name || `@${profile.username}`}
              </h2>
              {profile.display_name && (
                <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={() => setShowSharePicker(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-soft-50 text-sky-soft-600 rounded-xl text-sm font-medium hover:bg-sky-soft-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </motion.div>

        {/* This Month's Stats - 4 clear metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="mb-2 px-1">
            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">This Month</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MONTHLY_UI_STATS.map((statKey) => (
              <StatCard
                key={statKey}
                label={getStatLabel(statKey)}
                value={
                  statKey === 'avgMood'
                    ? <MoodCircle score={statValues[statKey]} size="lg" />
                    : formatStat(statKey, statValues[statKey])
                }
              />
            ))}
          </div>
        </motion.div>

        {/* Call Timeline - bead-on-a-string view of last 3 months */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <CallTimeline calls={calls} ratingsMap={ratingsMap} />
        </motion.div>

        {/* Insights - Trends & Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InsightsSection
            stats={stats}
            currentStreak={profile.current_streak ?? 0}
            longestStreak={profile.longest_streak ?? 0}
          />
        </motion.div>

        {/* Achievements - Strava-style badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl shadow-soft-lg p-5"
        >
          <h3 className="text-sm font-medium text-gray-500 mb-3">Achievements</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-full flex-shrink-0 ${
                  badge.earned
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-100 border border-gray-200 opacity-50'
                }`}
                title={badge.description}
              >
                <span className={`text-lg ${badge.earned ? '' : 'grayscale'}`}>
                  {badge.earned ? badge.emoji : '🔒'}
                </span>
                <span className={`text-sm font-medium whitespace-nowrap ${
                  badge.earned ? 'text-amber-800' : 'text-gray-500'
                }`}>
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Friends Section */}
        <FriendsSection userId={user?.id} username={profile?.username} />

        {/* My Calls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-soft-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">My Calls</h3>
            <Link
              to="/calls"
              className="text-sm text-sky-soft-600 hover:text-sky-soft-700"
            >
              Edit schedule
            </Link>
          </div>

          <CallHistoryList
            calls={calls}
            ratingsMap={ratingsMap}
            engagementMap={engagementMap}
            onRateClick={handleHistoryItemClick}
            onEngagementClick={(activityId) => setSelectedActivityForEngagement(activityId)}
            isLoading={isLoading}
          />
        </motion.div>
      </main>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal.isOpen && (
          <RateCallModal
            callDate={ratingModal.callDate}
            existingRating={ratingModal.existingRating}
            onClose={closeRatingModal}
            onSaved={refetchRatings}
          />
        )}
      </AnimatePresence>

      {/* Engagement Modal (likers + comments) */}
      <EngagementModal
        activityId={selectedActivityForEngagement}
        onClose={() => setSelectedActivityForEngagement(null)}
      />

      {/* Unified Share Picker */}
      <SharePickerModal
        isOpen={showSharePicker}
        onClose={() => setShowSharePicker(false)}
        month={currentMonth}
        stats={stats}
        currentStreak={profile.current_streak ?? 0}
        longestStreak={profile.longest_streak ?? 0}
        calls={calls}
        ratings={ratings}
        heartsReceived={heartsReceived}
      />
    </div>
    </PullToRefreshWrapper>
  );
}
