// Profile page - transformed to call history view with settings gear
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCalls } from '../hooks/useCalls';
import { useCallRatings } from '../hooks/useCallRatings';
import { CallHistoryList } from '../components/CallHistoryList';
import { RateCallModal } from '../components/RateCallModal';
import type { CallRating } from '../types/database';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { calls, loading: callsLoading } = useCalls(user?.id);
  const { ratingsMap, isLoading: ratingsLoading } = useCallRatings(user?.id);

  // Modal state for rating
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    callDate: string;
    existingRating?: CallRating;
  }>({ isOpen: false, callDate: '' });

  // Handle click on call in history list
  const handleHistoryItemClick = (callDate: string, existingRating?: CallRating) => {
    setRatingModal({ isOpen: true, callDate, existingRating });
  };

  // Close modal
  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, callDate: '' });
  };

  if (!profile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isLoading = callsLoading || ratingsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header with Settings Gear */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">History</h1>
          <Link
            to="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Past Calls List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Past Calls</h2>
            <Link
              to="/calls"
              className="text-sm text-sky-soft-600 hover:text-sky-soft-700"
            >
              Edit schedule
            </Link>
          </div>

          <CallHistoryList
            calls={calls}
            ratingsMap={ratingsMap}
            onRateClick={handleHistoryItemClick}
            isLoading={isLoading}
          />
        </motion.div>
      </main>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal.isOpen && (
          <RateCallModal
            callDate={ratingModal.callDate}
            existingRating={ratingModal.existingRating}
            onClose={closeRatingModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
