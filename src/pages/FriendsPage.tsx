// Friends management page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useHearts } from '../hooks/useHearts';
import { AddFriendForm } from '../components/AddFriendForm';
import { FriendsList } from '../components/FriendsList';
import { FriendProfileModal } from '../components/FriendProfileModal';
import type { Friend } from '../types/friend';

export default function FriendsPage() {
  const { user, profile } = useAuth();
  const { friends, loading, addFriend, updateFriendHeartStatus, beginMutation, endMutation } = useFriends(user?.id);
  const { sendHeart } = useHearts(user?.id);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleAddFriend = async (username: string) => {
    return addFriend(username);
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseModal = () => {
    setSelectedFriend(null);
  };

  const handleShare = async () => {
    const username = profile?.username;
    if (!username) return;

    const shareText = `Add me on WhiteCall 🤍\nMy username: ${username}\nhttps://whitecall.app`;

    // Try native share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me on WhiteCall',
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to copy
      }
    }

    // Fallback: copy to clipboard (copy full message, not just username)
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Friends</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Add Friend Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-4"
        >
          <AddFriendForm onAddFriend={handleAddFriend} />

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Invite/Share Section */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600">Share your username</p>
              <p className="text-base font-medium text-gray-800 truncate">
                @{profile?.username || '...'}
              </p>
            </div>
            <button
              onClick={handleShare}
              className="ml-3 px-4 py-2 bg-sky-soft-100 text-sky-soft-700 rounded-lg text-sm font-medium hover:bg-sky-soft-200 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-3 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading friends...</p>
            </div>
          ) : (
            <FriendsList
              friends={friends}
              onSendHeart={handleSendHeart}
              onFriendClick={handleFriendClick}
            />
          )}
        </motion.div>
      </main>

      {/* Friend Profile Modal */}
      <FriendProfileModal friend={selectedFriend} onClose={handleCloseModal} />
    </div>
  );
}
