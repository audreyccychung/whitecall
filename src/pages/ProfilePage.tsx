// Profile page - view and edit user profile
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { EditAvatarModal } from '../components/EditAvatarModal';
import { EditUsernameModal } from '../components/EditUsernameModal';
import { EditDisplayNameModal } from '../components/EditDisplayNameModal';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);

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
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6 sm:p-8"
        >
          {/* Hero Avatar - Tappable */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative group focus:outline-none"
            >
              <AvatarDisplay
                avatarType={profile.avatar_type}
                avatarColor={profile.avatar_color}
                size="xl"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium drop-shadow-md transition-opacity">
                  Change
                </span>
              </div>
            </button>
            <p className="text-sm text-gray-500 mt-2">Tap to change</p>
            <h2 className="text-xl font-bold text-gray-800 mt-3">
              @{profile.username}
            </h2>
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
