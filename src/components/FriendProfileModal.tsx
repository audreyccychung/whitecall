// Friend profile modal - bottom sheet showing upcoming calls
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { useFriendCalls } from '../hooks/useFriendCalls';
import { formatCallDateList, getTodayDate } from '../utils/date';
import type { Friend } from '../types/friend';

interface FriendProfileModalProps {
  friend: Friend | null;
  onClose: () => void;
  // Optional: for group member context where they may not be friends yet
  showAddFriend?: boolean;
  onAddFriend?: (username: string) => Promise<{ success: boolean; error?: string }>;
}

const MAX_VISIBLE_CALLS = 6;

export function FriendProfileModal({ friend, onClose, showAddFriend, onAddFriend }: FriendProfileModalProps) {
  const { calls, loading, error } = useFriendCalls(friend?.id || null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);

  const handleAddFriend = async () => {
    if (!friend || !onAddFriend) return;

    setAddingFriend(true);
    setAddFriendError(null);

    const result = await onAddFriend(friend.username);

    if (result.success) {
      setAddFriendSuccess(true);
    } else {
      setAddFriendError(result.error || 'Failed to add friend');
    }

    setAddingFriend(false);
  };

  const today = getTodayDate();
  const visibleCalls = calls.slice(0, MAX_VISIBLE_CALLS);
  const remainingCount = calls.length - MAX_VISIBLE_CALLS;

  return (
    <AnimatePresence>
      {friend && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Content */}
            <div className="px-6 pb-8 pt-2 modal-safe-bottom sm:pb-8">
              {/* Profile header */}
              <div className="flex items-center gap-4 mb-4">
                <AvatarDisplay
                  avatarType={friend.avatar_type}
                  avatarColor={friend.avatar_color}
                  size="large"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {friend.display_name || friend.username}
                  </h2>
                  <p className="text-sm text-gray-500">@{friend.username}</p>
                </div>
              </div>

              {/* Add Friend button (for group member context) */}
              {showAddFriend && onAddFriend && !addFriendSuccess && (
                <div className="mb-6">
                  {addFriendError && (
                    <p className="text-sm text-red-600 mb-2">{addFriendError}</p>
                  )}
                  <button
                    onClick={handleAddFriend}
                    disabled={addingFriend}
                    className="w-full py-2.5 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {addingFriend ? (
                      'Adding...'
                    ) : (
                      <>
                        <span>👋</span> Add Friend
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Success message after adding */}
              {addFriendSuccess && (
                <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-xl text-center">
                  <span className="font-medium">Friend added!</span>
                </div>
              )}

              {/* Upcoming calls section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Upcoming Calls
                </h3>

                {loading ? (
                  <div className="py-6 text-center">
                    <div className="w-8 h-8 border-3 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : error ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                ) : calls.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-gray-500">No upcoming calls scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleCalls.map((call, index) => {
                      const isToday = call.call_date === today;
                      const isNext = index === 0;

                      return (
                        <div
                          key={call.id}
                          className={`px-4 py-3 rounded-xl ${
                            isNext
                              ? 'bg-sky-soft-100 border border-sky-soft-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-medium ${
                                isNext ? 'text-sky-soft-700' : 'text-gray-700'
                              }`}
                            >
                              {formatCallDateList(call.call_date)}
                            </span>
                            {isToday && (
                              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                Today
                              </span>
                            )}
                            {isNext && !isToday && (
                              <span className="text-xs font-semibold text-sky-soft-600 bg-sky-soft-200 px-2 py-0.5 rounded-full">
                                Next
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {remainingCount > 0 && (
                      <p className="text-sm text-gray-500 text-center pt-2">
                        +{remainingCount} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
