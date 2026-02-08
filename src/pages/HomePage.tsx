// Main home page - user's avatar, hearts, friends on call feed
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useHearts } from '../hooks/useHearts';
import { useFriends } from '../hooks/useFriends';
import { useCalls } from '../hooks/useCalls';
import { useOnboarding } from '../hooks/useOnboarding';
import { useStore } from '../lib/store';
import { getTodayDate } from '../utils/date';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { HeartDisplay } from '../components/HeartDisplay';
import { HeartButton } from '../components/HeartButton';
import { HeartCounterAnimation } from '../components/HeartCounterAnimation';
import { HeartSendersList } from '../components/HeartSendersList';
import { ActivityFeed } from '../components/ActivityFeed';
import { NotificationBell } from '../components/NotificationBell';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { isOnDutyShift } from '../constants/shiftTypes';

export default function HomePage() {
  const { user, profile } = useAuth();
  const { stats, sendHeartWithOptimism, heartsReceived } = useHearts(user?.id);
  const [heartsPulse, setHeartsPulse] = useState(false);
  const { friends, loading: friendsLoading, updateFriendHeartStatus, beginMutation } = useFriends(user?.id);

  // Onboarding for new users
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Load calls data (this syncs to global store)
  useCalls(user?.id);

  // Read shift data from global store - subscribing to shiftMap triggers re-render when it changes
  const shiftMap = useStore((state) => state.shiftMap);
  const isCallStatusLoaded = useStore((state) => state.isCallStatusLoaded);

  // Compute on-call status: only on-duty shift types count (not day_off, off, work, half_day)
  const today = getTodayDate();
  const todayShift = shiftMap.get(today);
  const isUserOnCall = isCallStatusLoaded && !!todayShift && isOnDutyShift(todayShift);

  const handleSendHeart = async (friendId: string): Promise<void> => {
    // Token-based lock to prevent background refetch from overwriting optimistic update
    const release = beginMutation();

    try {
      // Use consolidated optimistic heart sending
      await sendHeartWithOptimism(friendId, {
        onOptimisticUpdate: () => updateFriendHeartStatus(friendId, false),
        onRollback: () => updateFriendHeartStatus(friendId, true),
      });
    } finally {
      release();
    }
  };

  // Filter friends who are on call, sorted: can send heart first, then alphabetically
  const friendsOnCall = friends
    .filter((f) => f.is_on_call)
    .sort((a, b) => {
      // Friends you can still send a heart to come first
      if (a.can_send_heart && !b.can_send_heart) return -1;
      if (!a.can_send_heart && b.can_send_heart) return 1;
      // Then alphabetically by display name or username
      const nameA = (a.display_name || a.username).toLowerCase();
      const nameB = (b.display_name || b.username).toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Filter hearts received today for the senders list
  const heartsReceivedToday = heartsReceived.filter((h) => h.shift_date === today);

  if (!profile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">WhiteCall</h1>
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Streak Banner - only show if streak > 0 */}
        {profile.current_streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl px-4 py-2 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🔥</span>
            <span className="font-semibold text-orange-700">
              {profile.current_streak}-day streak!
            </span>
          </motion.div>
        )}

        {/* User Status - Always shows */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-soft p-3"
        >
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0 pt-0.5">
              <AvatarDisplay
                avatarType={profile.avatar_type}
                avatarColor={profile.avatar_color}
                size="small"
              />
              {isUserOnCall && stats.received_today > 0 && (
                <HeartDisplay count={stats.received_today} pulse={heartsPulse} size="small" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <HeartCounterAnimation count={stats.received_today} isOnCall={isUserOnCall} compact />
            </div>
            {isUserOnCall && heartsReceivedToday.length > 0 && (
              <HeartSendersList
                hearts={heartsReceivedToday}
                onTap={() => {
                  setHeartsPulse(true);
                  setTimeout(() => setHeartsPulse(false), 600);
                }}
                compact
              />
            )}
          </div>
        </motion.div>

        {/* Friends on Call - Compact list */}
        {!friendsLoading && friendsOnCall.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Friends on call</h3>
              <span className="text-xs text-gray-400">{friendsOnCall.length} today</span>
            </div>
            <div className="space-y-1.5">
              {friendsOnCall.map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between py-2 px-2 gap-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <AvatarDisplay
                      avatarType={friend.avatar_type}
                      avatarColor={friend.avatar_color}
                      size="small"
                    />
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {friend.display_name || friend.username}
                    </p>
                  </div>
                  <HeartButton
                    onClick={() => handleSendHeart(friend.id)}
                    alreadySent={!friend.can_send_heart}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no friends on call */}
        {!friendsLoading && friendsOnCall.length === 0 && friends.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft p-3 text-center">
            <p className="text-xl mb-0.5">😌</p>
            <p className="text-xs text-gray-500">No friends on call today</p>
          </div>
        )}

        {/* Activity Feed - Friends' call ratings */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-6">
          <ActivityFeed userId={user?.id} />
        </div>
      </main>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onComplete={completeOnboarding} />
        )}
      </AnimatePresence>
    </div>
  );
}
