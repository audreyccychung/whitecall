// Add friend by link page - handles /add/:username invite links
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFriends, ADD_FRIEND_MESSAGES } from '../hooks/useFriends';
import { AvatarDisplay } from '../components/AvatarDisplay';
import type { UserPreview } from '../types/friend';
import type { AddFriendCode } from '../types/friend';

export default function AddFriendByLinkPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getUserPreview, addFriend } = useFriends(user?.id);

  const [preview, setPreview] = useState<UserPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Load user preview on mount
  useEffect(() => {
    if (!username) return;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      const info = await getUserPreview(username);
      setPreview(info);
      setIsLoadingPreview(false);
    };

    loadPreview();
  }, [username]);

  // Handle add friend button
  const handleAdd = async () => {
    if (!username) return;
    setAddError(null);
    setIsAdding(true);

    const result = await addFriend(username);

    if (result.success || result.code === 'ALREADY_FRIENDS') {
      setAddSuccess(true);
      // Brief delay to show success before navigating
      setTimeout(() => navigate('/home', { replace: true }), 800);
    } else {
      const code = result.code as AddFriendCode;
      setAddError(ADD_FRIEND_MESSAGES[code] || ADD_FRIEND_MESSAGES.UNKNOWN_ERROR);
      setIsAdding(false);
    }
  };

  // Loading state
  if (authLoading || isLoadingPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (addSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full text-center"
        >
          <p className="text-6xl mb-4">🤍</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Friend added!</h2>
          <p className="text-gray-600">
            You and <span className="font-medium">{preview?.display_name || preview?.username}</span> are now friends
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full"
      >
        {/* User not found */}
        {(!preview || !preview.valid) && (
          <div className="text-center py-8">
            <p className="text-6xl mb-4">🔍</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">User not found</h2>
            <p className="text-gray-600 mb-6">
              This link may be outdated or the username may have changed.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 transition-colors"
            >
              Go to WhiteCall
            </Link>
          </div>
        )}

        {/* Valid user preview */}
        {preview?.valid && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AvatarDisplay
                avatarType={preview.avatar_type!}
                avatarColor={preview.avatar_color!}
                avatarUrl={preview.avatar_url}
                size="large"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {preview.display_name || preview.username}
            </h2>
            <p className="text-gray-500 mb-6">@{preview.username}</p>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {addError}
              </div>
            )}

            {/* Not logged in */}
            {!user && (
              <div className="space-y-3">
                <Link
                  to={`/login?redirect=/add/${username}`}
                  className="block w-full py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors"
                >
                  Sign in to add friend
                </Link>
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to={`/signup?redirect=/add/${username}`} className="text-sky-soft-600 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            )}

            {/* Logged in */}
            {user && (
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="w-full py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:opacity-50 transition-colors"
              >
                {isAdding ? 'Adding...' : 'Add Friend'}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
