// Modal for editing username
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EditUsernameModalProps {
  currentUsername: string;
  onClose: () => void;
}

export function EditUsernameModal({ currentUsername, onClose }: EditUsernameModalProps) {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = username !== currentUsername;
  const isValid = username.length >= 3 && username.length <= 20 && /^[a-z0-9_]+$/.test(username);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    if (!isValid) {
      setError('Username must be 3-20 characters, lowercase letters, numbers, and underscores only');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('update_profile', {
        p_avatar_type: null,
        p_avatar_color: null,
        p_username: username,
        p_display_name: null,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: string };

      if (result.code !== 'SUCCESS') {
        const errorMessages: Record<string, string> = {
          UNAUTHORIZED: 'You are not authorized to make this change',
          USERNAME_TAKEN: 'This username is already taken',
          INVALID_USERNAME: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only',
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
        className="bg-white w-full sm:w-auto sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 modal-safe-bottom sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Change Username</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
                placeholder="username"
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              3-20 characters, lowercase letters, numbers, and underscores only
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
            disabled={saving || !hasChanges || !isValid}
            className="flex-1 py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
