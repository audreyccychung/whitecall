// Settings page - user account settings (moved from ProfilePage)
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { supabase } from '../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { EditAvatarModal } from '../components/EditAvatarModal';
import { EditUsernameModal } from '../components/EditUsernameModal';
import { EditDisplayNameModal } from '../components/EditDisplayNameModal';

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [savingShareData, setSavingShareData] = useState(false);
  const [savingShareFeed, setSavingShareFeed] = useState(false);

  // Push notifications
  const {
    status: pushStatus,
    loading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    needsInstall: pushNeedsInstall,
    isDenied: pushDenied,
  } = usePushNotifications(user?.id);

  const handlePushToggle = async () => {
    if (pushSubscribed) {
      await unsubscribePush();
    } else {
      await subscribePush();
    }
  };

  const handleShareDataToggle = async () => {
    if (!profile) return;

    setSavingShareData(true);
    try {
      const newValue = !profile.share_data_with_groups;
      const { error } = await supabase.rpc('update_share_data_setting', {
        p_share: newValue,
      });

      if (error) throw error;
      await refreshProfile();
    } catch (err) {
      console.error('[SettingsPage] Failed to update share data setting:', err);
    } finally {
      setSavingShareData(false);
    }
  };

  const handleShareFeedToggle = async () => {
    if (!profile) return;

    setSavingShareFeed(true);
    try {
      const newValue = !profile.share_activity_feed;
      const { data, error } = await supabase.rpc('update_share_activity_setting', {
        p_enabled: newValue,
      });

      if (error) throw error;

      const result = data as { code: string };
      if (result.code !== 'SUCCESS') {
        console.error('[SettingsPage] Failed to update feed setting:', result.code);
        return;
      }

      await refreshProfile();
    } catch (err) {
      console.error('[SettingsPage] Failed to update feed setting:', err);
    } finally {
      setSavingShareFeed(false);
    }
  };

  if (!profile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Determine auth provider
  const authProvider = user.app_metadata?.provider || 'email';
  const isGoogleUser = authProvider === 'google';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-4">
          <Link
            to="/profile"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to profile"
          >
            <span className="text-xl text-gray-600">‹</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6 sm:p-8"
        >
          {/* Hero Avatar - Compact */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative group focus:outline-none flex-shrink-0"
            >
              <AvatarDisplay
                avatarType={profile.avatar_type}
                avatarColor={profile.avatar_color}
                size="medium"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                @{profile.username}
              </h2>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="text-sm text-sky-soft-600 hover:text-sky-soft-700"
              >
                Change avatar
              </button>
            </div>
          </div>

          {/* Profile Settings - Compact */}
          <div className="space-y-2">
            {/* Username Row */}
            <button
              onClick={() => setShowUsernameModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-sm text-gray-500">Username</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">@{profile.username}</span>
                <span className="text-gray-400 text-sm">›</span>
              </div>
            </button>

            {/* Display Name Row */}
            <button
              onClick={() => setShowDisplayNameModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-sm text-gray-500">Display Name</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">
                  {profile.display_name || 'Not set'}
                </span>
                <span className="text-gray-400 text-sm">›</span>
              </div>
            </button>
          </div>

          {/* Account Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Account</p>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                {isGoogleUser ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                <div>
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="font-medium text-gray-800">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Privacy</p>

            <button
              onClick={handleShareDataToggle}
              disabled={savingShareData}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Share data with groups</p>
                  <p className="text-sm text-gray-500">
                    {profile.share_data_with_groups
                      ? 'Your call ratings are visible to group members'
                      : 'Your data is private from groups'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {savingShareData ? (
                  <div className="w-5 h-5 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                    profile.share_data_with_groups ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                      profile.share_data_with_groups ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={handleShareFeedToggle}
              disabled={savingShareFeed}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 mt-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📢</span>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Share in Support Feed</p>
                  <p className="text-sm text-gray-500">
                    {profile.share_activity_feed
                      ? 'Friends see your call ratings in their feed'
                      : 'Your ratings are hidden from friends\' feeds'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {savingShareFeed ? (
                  <div className="w-5 h-5 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                    profile.share_activity_feed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                      profile.share_activity_feed ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Notifications Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Notifications</p>

            {pushNeedsInstall ? (
              // iOS but not installed as PWA
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📲</span>
                  <div>
                    <p className="font-medium text-amber-800">Install app for notifications</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Tap the share button below, then "Add to Home Screen" to enable push notifications.
                    </p>
                  </div>
                </div>
              </div>
            ) : pushSupported ? (
              // Push is supported
              <button
                onClick={handlePushToggle}
                disabled={pushLoading || pushDenied}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pushSubscribed ? '🔔' : '🔕'}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Push Notifications</p>
                    <p className="text-sm text-gray-500">
                      {pushSubscribed && 'Enabled - you\'ll get heart alerts'}
                      {pushStatus === 'granted' && !pushSubscribed && 'Tap to enable heart alerts'}
                      {pushStatus === 'prompt' && 'Tap to enable heart alerts'}
                      {pushDenied && 'Blocked - enable in browser settings'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {pushLoading ? (
                    <div className="w-5 h-5 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                      pushSubscribed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                        pushSubscribed ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  )}
                </div>
              </button>
            ) : (
              // Push not supported
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">
                  Push notifications are not supported on this device or browser.
                </p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="w-full mt-8 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAvatarModal && (
          <EditAvatarModal
            currentType={profile.avatar_type}
            currentColor={profile.avatar_color}
            onClose={() => setShowAvatarModal(false)}
          />
        )}
        {showUsernameModal && (
          <EditUsernameModal
            currentUsername={profile.username}
            onClose={() => setShowUsernameModal(false)}
          />
        )}
        {showDisplayNameModal && (
          <EditDisplayNameModal
            currentDisplayName={profile.display_name}
            onClose={() => setShowDisplayNameModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
