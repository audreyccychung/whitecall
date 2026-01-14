// Friends management page
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useHearts } from '../hooks/useHearts';
import { AddFriendForm } from '../components/AddFriendForm';
import { FriendsList } from '../components/FriendsList';
import { FriendProfileModal } from '../components/FriendProfileModal';
import type { Friend } from '../types/friend';

export default function FriendsPage() {
  const { user } = useAuth();
  const { friends, loading, addFriend } = useFriends(user?.id);
  const { sendHeart } = useHearts(user?.id);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleSendHeart = async (friendId: string) => {
    await sendHeart(friendId);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/home"
              className="text-gray-600 hover:text-gray-800 font-semibold text-sm sm:text-base transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Friends</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Add Friend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Friend</h2>
          <AddFriendForm onAddFriend={handleAddFriend} />
        </motion.div>

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Friends ({friends.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading friends...</p>
            </div>
          ) : (
            <FriendsList friends={friends} onSendHeart={handleSendHeart} onFriendClick={handleFriendClick} />
          )}
        </motion.div>

        {/* Friends on Call */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Friends on Call Today</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <FriendsList friends={friends} onSendHeart={handleSendHeart} onFriendClick={handleFriendClick} showOnlyOnCall />
          )}
        </motion.div>
      </main>

      {/* Friend Profile Modal */}
      <FriendProfileModal friend={selectedFriend} onClose={handleCloseModal} />
    </div>
  );
}
