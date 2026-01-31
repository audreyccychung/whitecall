// Friends management section for Profile page
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriends } from '../../hooks/useFriends';
import { AddFriendForm } from '../AddFriendForm';
import { AvatarDisplay } from '../AvatarDisplay';
import { FriendProfileModal } from '../FriendProfileModal';
import type { Friend } from '../../types/friend';

interface FriendsSectionProps {
  userId: string | undefined;
  username: string | undefined;
}

export function FriendsSection({ userId, username }: FriendsSectionProps) {
  const { friends, loading, addFriend, removeFriend } = useFriends(userId);
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddFriend = async (friendUsername: string) => {
    const result = await addFriend(friendUsername);
    if (result.success) {
      setShowAddForm(false);
    }
    return result;
  };

  const handleShare = async () => {
    if (!username) return;

    const shareText = `Add me on WhiteCall\nMy username: ${username}\nhttps://whitecall.app`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me on WhiteCall',
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseModal = () => {
    setSelectedFriend(null);
  };

  const visibleFriends = expanded ? friends : friends.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-white rounded-2xl shadow-soft-lg p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">
          Friends {!loading && `(${friends.length})`}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-sky-soft-600 hover:text-sky-soft-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* Add Friend Form (collapsible) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4 border-b border-gray-100 mb-4">
              <AddFriendForm onAddFriend={handleAddFriend} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Username */}
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">Your username</p>
          <p className="text-sm font-medium text-gray-800 truncate">@{username || '...'}</p>
        </div>
        <button
          onClick={handleShare}
          className="ml-2 px-3 py-1.5 bg-sky-soft-100 text-sky-soft-700 rounded-lg text-xs font-medium hover:bg-sky-soft-200 transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </>
          )}
        </button>
      </div>

      {/* Friends Grid */}
      {loading ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No friends yet</p>
          <p className="text-xs text-gray-400 mt-1">Add friends to support them on call</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-2">
            {visibleFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleFriendClick(friend)}
                className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AvatarDisplay
                  avatarType={friend.avatar_type}
                  avatarColor={friend.avatar_color}
                  size="small"
                />
                <p className="text-[10px] text-gray-600 max-w-full truncate">
                  {friend.display_name || friend.username}
                </p>
              </button>
            ))}
          </div>

          {friends.length > 6 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 text-xs text-sky-soft-600 hover:text-sky-soft-700 font-medium"
            >
              {expanded ? 'Show less' : `See all ${friends.length} friends`}
            </button>
          )}
        </>
      )}

      {/* Friend Profile Modal */}
      <FriendProfileModal
        friend={selectedFriend}
        onClose={handleCloseModal}
        showRemoveFriend={selectedFriend !== null}
        onRemoveFriend={async (friendId) => {
          const result = await removeFriend(friendId);
          return { success: result.success, error: result.error };
        }}
      />
    </motion.div>
  );
}
