// Modal for rating a past call
import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { CallRating, CallRatingValue } from '../types/database';
import { RATING_EMOJI, RATING_LABEL } from '../types/database';
import { useCallRatings } from '../hooks/useCallRatings';
import { useAuth } from '../contexts/AuthContext';

interface RateCallModalProps {
  callDate: string; // YYYY-MM-DD
  existingRating?: CallRating;
  onClose: () => void;
  onSaved?: () => void;
}

const RATING_OPTIONS: CallRatingValue[] = ['rough', 'okay', 'good', 'great'];

export function RateCallModal({ callDate, existingRating, onClose, onSaved }: RateCallModalProps) {
  const { user } = useAuth();
  const { saveRating, isSaving } = useCallRatings(user?.id);

  const [selectedRating, setSelectedRating] = useState<CallRatingValue | null>(
    existingRating?.rating || null
  );
  const [notes, setNotes] = useState(existingRating?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const formattedDate = format(parseISO(callDate), 'EEEE, MMMM d, yyyy');
  const isEditing = !!existingRating;

  const handleSave = async () => {
    if (!selectedRating) {
      setError('Please select a rating');
      return;
    }

    setError(null);
    const result = await saveRating(callDate, selectedRating, notes || null);

    if (result.success) {
      onSaved?.();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full sm:w-auto sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Rating' : 'Rate Your Call'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-500 mb-6">{formattedDate}</p>

        {/* Rating Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">How was your call?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_OPTIONS.map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                disabled={isSaving}
                className={`
                  flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all
                  ${selectedRating === rating
                    ? 'bg-sky-soft-100 ring-2 ring-sky-soft-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-2xl mb-1">{RATING_EMOJI[rating]}</span>
                <span className="text-xs text-gray-600">{RATING_LABEL[rating]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes (optional) */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Any memorable moments? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none resize-none"
            placeholder="Tough case, good outcome..."
            rows={3}
            maxLength={500}
            disabled={isSaving}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/500</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedRating}
            className="flex-1 py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
