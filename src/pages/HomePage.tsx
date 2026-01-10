// Main home page - user's avatar, hearts, call status, friends on call feed
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../lib/store';
import { useHearts } from '../hooks/useHearts';
import { useFriends } from '../hooks/useFriends';
import { useCallStatus } from '../hooks/useCallStatus';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { HeartDisplay } from '../components/HeartDisplay';
import { HeartButton } from '../components/HeartButton';
import { StreakDisplay } from '../components/StreakDisplay';
import { HeartCounterAnimation } from '../components/HeartCounterAnimation';
import { OnboardingModal } from '../components/OnboardingModal';
import { FirstHeartConfetti } from '../components/FirstHeartConfetti';
import { miniCelebration } from '../utils/confetti';

export default function HomePage() {
  const { user, profile, signOut } = useAuth();
  const { showOnboardingModal, setShowOnboardingModal } = useStore();
  const { stats, sendHeart } = useHearts(user?.id);
  const { friends, loading: friendsLoading } = useFriends(user?.id);
  const { updating, toggleCallStatus } = useCallStatus(user?.id);

  // Check if user is on call TODAY (not just is_on_call flag)
  const isOnCallToday = () => {
    if (!profile?.is_on_call) return false;
    if (!profile?.call_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return profile.call_date === today;
  };

  const [localOnCall, setLocalOnCall] = useState(isOnCallToday());

  useEffect(() => {
    setLocalOnCall(isOnCallToday());
  }, [profile?.is_on_call, profile?.call_date]);

  const handleToggleCallStatus = async (checked: boolean) => {
    setLocalOnCall(checked);
    const success = await toggleCallStatus(checked);
    if (!success) {
      setLocalOnCall(!checked); // Revert on error
    }
  };

  const handleSendHeart = async (friendId: string) => {
    const result = await sendHeart(friendId);
    if (result.success) {
      miniCelebration();
    }
  };

  // Filter friends who are on call TODAY (not just have is_on_call = true)
  const today = new Date().toISOString().split('T')[0];
  const friendsOnCall = friends.filter((f) => f.is_on_call && f.call_date === today);

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">WhiteCall 🤍</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/friends"
              className="px-4 py-2 text-gray-700 hover:text-sky-soft-600 font-medium transition-colors"
            >
              Friends
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Streak Display */}
        {profile.current_streak > 0 && (
          <div className="flex justify-center">
            <StreakDisplay
              currentStreak={profile.current_streak}
              longestStreak={profile.longest_streak}
            />
          </div>
        )}

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
            <HeartCounterAnimation count={stats.received_today} />

            {/* On Call Toggle */}
            <div className="mt-6 flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-xl">
              <input
                type="checkbox"
                id="onCall"
                checked={localOnCall}
                onChange={(e) => handleToggleCallStatus(e.target.checked)}
                disabled={updating}
                className="w-5 h-5 text-sky-soft-500 rounded focus:ring-2 focus:ring-sky-soft-500"
              />
              <label htmlFor="onCall" className="text-gray-800 font-medium cursor-pointer">
                I'm on call today
              </label>
            </div>
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

      {/* Onboarding Modal */}
      {user && (
        <OnboardingModal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          userId={user.id}
        />
      )}

      {/* First Heart Confetti */}
      <FirstHeartConfetti heartCount={stats.received_today} />
    </div>
  );
}
