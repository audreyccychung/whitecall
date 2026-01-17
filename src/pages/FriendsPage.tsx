// Friends management page
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useHearts } from '../hooks/useHearts';
import { AddFriendForm } from '../components/AddFriendForm';
import { FriendsList } from '../components/FriendsList';
import { FriendProfileModal } from '../components/FriendProfileModal';
import type { Friend } from '../types/friend';

export default function FriendsPage() {
  const { user } = useAuth();
  const { friends, loading, addFriend, updateFriendHeartStatus } = useFriends(user?.id);
  const { sendHeart } = useHearts(user?.id);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSendHeart = async (friendId: string) => {
    // Optimistic update: immediately show "Sent" state
    updateFriendHeartStatus(friendId, false);

    const result = await sendHeart(friendId);

    if (!result.success) {
      // Rollback on failure
      updateFriendHeartStatus(friendId, true);
    }
    // No refreshFriends() - optimistic update is sufficient
  };

  const handleAddFriend = async (username: string) => {
    const result = await addFriend(username);
    if (result.success) {
      setShowAddForm(false);
    }
    return result;
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseModal = () => {
    setSelectedFriend(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header with Add button */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Friends</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-soft-100 text-sky-soft-600 hover:bg-sky-soft-200 transition-colors"
            aria-label="Add friend"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Collapsible Add Friend Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-soft p-4">
                <AddFriendForm onAddFriend={handleAddFriend} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Friends List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
