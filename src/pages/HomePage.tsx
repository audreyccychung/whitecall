// Main home page - user's avatar, hearts, friends on call feed
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useHearts } from '../hooks/useHearts';
import { useFriends } from '../hooks/useFriends';
import { useCalls } from '../hooks/useCalls';
import { useStore } from '../lib/store';
import { getTodayDate } from '../utils/date';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { HeartDisplay } from '../components/HeartDisplay';
import { HeartButton } from '../components/HeartButton';
import { HeartCounterAnimation } from '../components/HeartCounterAnimation';
import { HeartSendersList } from '../components/HeartSendersList';

export default function HomePage() {
  const { user, profile } = useAuth();
  const { stats, sendHeart, heartsReceived } = useHearts(user?.id);
  const [heartsPulse, setHeartsPulse] = useState(false);
  const { friends, loading: friendsLoading, updateFriendHeartStatus, beginMutation, endMutation } = useFriends(user?.id);

  // Load calls data (this syncs to global store)
  useCalls(user?.id);

  // Read call dates from global store - subscribing to callDates triggers re-render when it changes
  const callDates = useStore((state) => state.callDates);
  const isCallStatusLoaded = useStore((state) => state.isCallStatusLoaded);

  // Compute on-call status from the subscribed state
  const today = getTodayDate();
  const isUserOnCall = isCallStatusLoaded && callDates.has(today);

  const handleSendHeart = async (friendId: string) => {
    // Lock to prevent background refetch from overwriting optimistic update
    beginMutation();

    // Optimistic update: immediately show "Sent" state
    updateFriendHeartStatus(friendId, false);

    try {
      const result = await sendHeart(friendId);

      if (!result.success) {
        // Rollback on failure
        updateFriendHeartStatus(friendId, true);
      }
      // No refreshFriends() - optimistic update is sufficient
    } finally {
      // Release lock after mutation completes
      endMutation();
    }
  };

  // Filter friends who are on call (derived from calls table)
  const friendsOnCall = friends.filter((f) => f.is_on_call);

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
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">WhiteCall</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* User Status Card - Compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-4"
        >
          <div className="flex flex-col items-center">
            {/* Avatar with Hearts */}
            <div className="relative mb-2">
              <AvatarDisplay
                avatarType={profile.avatar_type}
                avatarColor={profile.avatar_color}
                size="large"
              />
              <HeartDisplay count={stats.received_today} pulse={heartsPulse} />
            </div>

            {/* User Info */}
            <h2 className="text-base font-bold text-gray-800 mb-2">
              {profile.display_name || profile.username}
            </h2>

            {/* Heart Counter */}
            <HeartCounterAnimation count={stats.received_today} isOnCall={isUserOnCall} />

            {/* Who sent hearts - only show if on call and received hearts */}
            {isUserOnCall && heartsReceivedToday.length > 0 && (
              <HeartSendersList
                hearts={heartsReceivedToday}
                onTap={() => {
                  setHeartsPulse(true);
                  setTimeout(() => setHeartsPulse(false), 600);
                }}
              />
            )}
          </div>
        </motion.div>

        {/* Friends on Call */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Friends on call today</h3>
          <p className="text-sm text-gray-500 mb-4">Wish them a white call 🤍</p>

          {friendsLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading friends...</p>
            </div>
          ) : friendsOnCall.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">😌</p>
              <p className="text-gray-600 mb-2">No friends on call today</p>
              <p className="text-sm text-gray-500">Enjoy the quiet day!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friendsOnCall.map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between px-4 py-3 gap-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AvatarDisplay
                      avatarType={friend.avatar_type}
                      avatarColor={friend.avatar_color}
                      size="medium"
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {friend.display_name || friend.username}
                      </p>
                      <p className="text-sm text-gray-400 truncate">@{friend.username}</p>
                    </div>
                  </div>

                  <div className="ml-3 flex-shrink-0">
                    <HeartButton
                      onClick={() => handleSendHeart(friend.id)}
                      alreadySent={!friend.can_send_heart}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Support Summary */}
        {stats.sent_today > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-50 to-sky-soft-50 rounded-xl p-6 text-center"
          >
            <p className="text-lg text-gray-700">
              You supported <span className="font-bold text-sky-soft-600">{stats.sent_today}</span>{' '}
              {stats.sent_today === 1 ? 'friend' : 'friends'} today
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
