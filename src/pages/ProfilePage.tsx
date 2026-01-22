// Profile page - identity + reflection, not admin analytics
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCalls } from '../hooks/useCalls';
import { useCallRatings } from '../hooks/useCallRatings';
import { useHearts } from '../hooks/useHearts';
import { useProfileStats } from '../hooks/useProfileStats';
import { useBadges } from '../hooks/useBadges';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { StatCard } from '../components/profile/StatCard';
import { TrendChart } from '../components/profile/TrendChart';
import { BadgesDisplay } from '../components/profile/BadgesDisplay';
import { CallHistoryList } from '../components/CallHistoryList';
import { RateCallModal } from '../components/RateCallModal';
import type { CallRating } from '../types/database';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { calls, loading: callsLoading } = useCalls(user?.id);
  const { ratings, ratingsMap, isLoading: ratingsLoading } = useCallRatings(user?.id);
  const { heartsReceived, stats: heartStats, loading: heartsLoading } = useHearts(user?.id);

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

  // Handle click on call in history list
  const handleHistoryItemClick = (callDate: string, existingRating?: CallRating) => {
    setRatingModal({ isOpen: true, callDate, existingRating });
  };

  // Close modal
  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, callDate: '' });
  };

  if (!profile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isLoading = callsLoading || ratingsLoading || heartsLoading;

  // Format avg mood as emoji
  const getMoodEmoji = (score: number | null) => {
    if (score === null) return '-';
    if (score >= 3.5) return '✨';
    if (score >= 2.5) return '😊';
    if (score >= 1.5) return '😐';
    return '😫';
  };

  // Format sleep
  const formatSleep = (hours: number | null) => {
    if (hours === null) return '-';
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Hero Section - Identity */}
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
          </div>
        </motion.div>

        {/* This Month's Stats - 3 clear metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">This Month</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Calls" value={stats.callsThisMonth} />
            <StatCard label="Avg Sleep" value={formatSleep(stats.avgSleep)} />
            <StatCard label="Avg Mood" value={getMoodEmoji(stats.avgMoodScore)} />
          </div>
        </motion.div>

        {/* Recent Trends - Primary analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TrendChart data={stats.trendData} />
        </motion.div>

        {/* Badges - De-emphasized earned markers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <BadgesDisplay badges={badges} />
        </motion.div>

        {/* My Calls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
            onRateClick={handleHistoryItemClick}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
