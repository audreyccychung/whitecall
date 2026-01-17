// Modal for editing user avatar
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AvatarSelector } from './AvatarSelector';
import type { AvatarType, AvatarColor } from '../types/avatar';

interface EditAvatarModalProps {
  currentType: string;
  currentColor: string;
  onClose: () => void;
}

export function EditAvatarModal({ currentType, currentColor, onClose }: EditAvatarModalProps) {
  const { refreshProfile } = useAuth();
  const [selectedType, setSelectedType] = useState<AvatarType>(currentType as AvatarType);
  const [selectedColor, setSelectedColor] = useState<AvatarColor>(currentColor as AvatarColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = selectedType !== currentType || selectedColor !== currentColor;

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('update_profile', {
        p_avatar_type: selectedType,
        p_avatar_color: selectedColor,
        p_username: null,
        p_display_name: null,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: string };

      if (result.code !== 'SUCCESS') {
        const errorMessages: Record<string, string> = {
          UNAUTHORIZED: 'You are not authorized to make this change',
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
        className="bg-white w-full sm:w-auto sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Change Avatar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <AvatarSelector
          selectedType={selectedType}
          selectedColor={selectedColor}
          onTypeChange={setSelectedType}
          onColorChange={setSelectedColor}
        />

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
