// Modal for editing display name
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EditDisplayNameModalProps {
  currentDisplayName: string | null;
  onClose: () => void;
}

export function EditDisplayNameModal({ currentDisplayName, onClose }: EditDisplayNameModalProps) {
  const { refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCurrent = currentDisplayName || '';
  const hasChanges = displayName !== normalizedCurrent;
  const isValid = displayName.length === 0 || (displayName.length >= 1 && displayName.length <= 30);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    if (!isValid) {
      setError('Display name must be 0-30 characters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('update_profile', {
        p_avatar_type: null,
        p_avatar_color: null,
        p_username: null,
        p_display_name: displayName || null,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: string };

      if (result.code !== 'SUCCESS') {
        const errorMessages: Record<string, string> = {
          UNAUTHORIZED: 'You are not authorized to make this change',
          INVALID_DISPLAY_NAME: 'Display name must be 0-30 characters',
          UNKNOWN_ERROR: 'Something went wrong. Please try again.',
        };
        setError(errorMessages[result.code] || 'Update failed');
        setSaving(false);
        return;
      }

      await refreshProfile();
      onClose();
    } catch (err) {
      setError('Failed to save changes');
      setSaving(false);
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Change Display Name</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
              placeholder="Your display name"
              maxLength={30}
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-2">
              This is how your name appears to friends. Leave blank to use your username.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
