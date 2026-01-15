// Main home page - user's avatar, hearts, friends on call feed
import { Link } from 'react-router-dom';
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

export default function HomePage() {
  const { user, profile, signOut } = useAuth();
  const { stats, sendHeart } = useHearts(user?.id);
  const { friends, loading: friendsLoading, refreshFriends } = useFriends(user?.id);

  // Load calls data (this syncs to global store)
  useCalls(user?.id);

  // Read call dates from global store - subscribing to callDates triggers re-render when it changes
  const callDates = useStore((state) => state.callDates);
  const isCallStatusLoaded = useStore((state) => state.isCallStatusLoaded);

  // Compute on-call status from the subscribed state
  const today = getTodayDate();
  const isUserOnCall = isCallStatusLoaded && callDates.has(today);

  const handleSendHeart = async (friendId: string) => {
    const result = await sendHeart(friendId);
    if (result.success) {
      await refreshFriends();
    }
  };

  // Filter friends who are on call (derived from calls table)
  const friendsOnCall = friends.filter((f) => f.is_on_call);

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
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/calls"
              className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-sky-soft-600 font-semibold text-sm sm:text-base transition-colors"
            >
              My Calls
            </Link>
            <Link
              to="/friends"
              className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-sky-soft-600 font-semibold text-sm sm:text-base transition-colors"
            >
              Friends
            </Link>
            <Link
              to="/groups"
              className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-sky-soft-600 font-semibold text-sm sm:text-base transition-colors"
            >
              Groups
            </Link>
            <button
              onClick={signOut}
              className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-red-600 font-semibold text-sm sm:text-base transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* User's Avatar with Hearts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-8"
        >
          <div className="flex flex-col items-center">
            {/* Avatar with Hearts */}
            <div className="relative mb-6">
              <AvatarDisplay
                avatarType={profile.avatar_type}
                avatarColor={profile.avatar_color}
                size="xl"
              />
              <HeartDisplay count={stats.received_today} />
            </div>

            {/* User Info */}
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {profile.display_name || profile.username}
            </h2>
            <p className="text-gray-600 mb-4">@{profile.username}</p>

            {/* Heart Counter */}
            <HeartCounterAnimation count={stats.received_today} isOnCall={isUserOnCall} />
          </div>
        </motion.div>

        {/* Friends on Call */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Friends on Call Today</h3>

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
            <div className="space-y-3">
              {friendsOnCall.map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AvatarDisplay
                      avatarType={friend.avatar_type}
                      avatarColor={friend.avatar_color}
                      size="medium"
                    />
                    <div>
                      <p className="font-medium text-gray-800">
                        {friend.display_name || friend.username}
                      </p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </div>

                  <HeartButton
                    onClick={() => handleSendHeart(friend.id)}
                    alreadySent={!friend.can_send_heart}
                  />
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-soft p-6 text-center">
            <div className="text-3xl font-bold text-sky-soft-600 mb-1">{stats.sent_today}</div>
            <div className="text-sm text-gray-600">Hearts sent today</div>
          </div>
          <div className="bg-white rounded-xl shadow-soft p-6 text-center">
            <div className="text-3xl font-bold text-sky-soft-600 mb-1">{friends.length}</div>
            <div className="text-sm text-gray-600">Friends</div>
          </div>
        </div>
      </main>
    </div>
  );
}
