// Modal for adding a past call with rating (like Strava manual entry)
import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isBefore, startOfDay } from 'date-fns';
import type { CallRatingValue } from '../types/database';
import { RATING_EMOJI, RATING_LABEL } from '../types/database';
import { supabase } from '../lib/supabase';

interface AddPastCallModalProps {
  onClose: () => void;
  onSaved: () => void; // Called after successful save to trigger refetch
}

// Result codes from add_past_call_with_rating RPC
type AddPastCallCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'DATE_NOT_IN_PAST'
  | 'INVALID_RATING'
  | 'INVALID_HOURS_SLEPT'
  | 'CALL_ALREADY_EXISTS'
  | 'UNKNOWN_ERROR';

// Exhaustive mapping: every code maps to exactly one message
const ADD_PAST_CALL_MESSAGES: Record<AddPastCallCode, string> = {
  SUCCESS: 'Call added!',
  UNAUTHORIZED: 'You must be logged in.',
  DATE_NOT_IN_PAST: 'Date must be in the past.',
  INVALID_RATING: 'Invalid rating value.',
  INVALID_HOURS_SLEPT: 'Hours slept must be between 0 and 12.',
  CALL_ALREADY_EXISTS: 'You already have a call on this date.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

const RATING_OPTIONS: CallRatingValue[] = ['rough', 'okay', 'good', 'great'];

// Generate sleep hour options (0 to 12 in 0.5 increments)
const SLEEP_OPTIONS: number[] = [];
for (let i = 0; i <= 12; i += 0.5) {
  SLEEP_OPTIONS.push(i);
}

export function AddPastCallModal({ onClose, onSaved }: AddPastCallModalProps) {
  // Default to yesterday
  const [selectedDate, setSelectedDate] = useState<string>(
    format(subDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedRating, setSelectedRating] = useState<CallRatingValue | null>(null);
  const [hoursSlept, setHoursSlept] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Max date is yesterday (can't add today or future)
  const maxDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const handleSave = async () => {
    if (!selectedRating) {
      setError('Please select a rating');
      return;
    }

    // Validate date is in the past
    const dateObj = new Date(selectedDate + 'T00:00:00');
    if (!isBefore(dateObj, startOfDay(new Date()))) {
      setError('Date must be in the past');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('add_past_call_with_rating', {
        p_call_date: selectedDate,
        p_rating: selectedRating,
        p_notes: notes || null,
        p_hours_slept: hoursSlept,
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; code: AddPastCallCode };
      const code = result.code || 'UNKNOWN_ERROR';

      if (result.success) {
        onSaved();
        onClose();
      } else {
        setError(ADD_PAST_CALL_MESSAGES[code] || ADD_PAST_CALL_MESSAGES.UNKNOWN_ERROR);
      }
    } catch (err) {
      console.error('[AddPastCallModal] Failed to add call:', err);
      setError(ADD_PAST_CALL_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsSaving(false);
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
        className="bg-white w-full sm:w-auto sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 modal-safe-bottom sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add Past Call</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Date Picker */}
        <div className="mb-6">
          <label htmlFor="call-date" className="block text-sm font-medium text-gray-700 mb-2">
            When was your call?
          </label>
          <input
            type="date"
            id="call-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={maxDate}
            disabled={isSaving}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
          />
        </div>

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

        {/* Hours Slept (optional) */}
        <div className="mb-6">
          <label htmlFor="hoursSlept" className="block text-sm font-medium text-gray-700 mb-2">
            How much did you sleep? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xl">😴</span>
            <select
              id="hoursSlept"
              value={hoursSlept ?? ''}
              onChange={(e) => setHoursSlept(e.target.value === '' ? null : parseFloat(e.target.value))}
              disabled={isSaving}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Not recorded</option>
              {SLEEP_OPTIONS.map((hours) => (
                <option key={hours} value={hours}>
                  {hours === 0 ? 'No sleep' : hours === 1 ? '1 hour' : `${hours} hours`}
                </option>
              ))}
            </select>
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
            {isSaving ? 'Adding...' : 'Add Call'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
