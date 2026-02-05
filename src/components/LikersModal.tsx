// Likers modal - bottom sheet showing who liked an activity
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { supabase } from '../lib/supabase';
import type { ActivityLiker, GetLikersCode } from '../types/database';

interface LikersModalProps {
  activityId: string | null;
  onClose: () => void;
}

// Exhaustive mapping: every code maps to exactly one message
const GET_LIKERS_MESSAGES: Record<GetLikersCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Activity not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_FRIENDS: 'You can only view likes from friends.',
  UNKNOWN_ERROR: 'Could not load likes.',
};

export function LikersModal({ activityId, onClose }: LikersModalProps) {
  const [likers, setLikers] = useState<ActivityLiker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLikers = useCallback(async () => {
    if (!activityId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_activity_likers', {
        p_activity_id: activityId,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: GetLikersCode; likers?: ActivityLiker[]; message?: string };

      if (result.code !== 'SUCCESS') {
        setError(GET_LIKERS_MESSAGES[result.code] || GET_LIKERS_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      setLikers(result.likers || []);
    } catch {
      setError(GET_LIKERS_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  // Load likers when modal opens
  useEffect(() => {
    if (activityId) {
      loadLikers();
    } else {
      // Reset state when modal closes
      setLikers([]);
      setError(null);
    }
  }, [activityId, loadLikers]);

  return (
    <AnimatePresence>
      {activityId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[60vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Content */}
            <div className="px-6 pb-8 pt-2 modal-safe-bottom sm:pb-8">
              {/* Header */}
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Liked by
              </h2>

              {loading ? (
                <div className="py-6 text-center">
                  <div className="w-8 h-8 border-3 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : error ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : likers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-gray-500">No likes yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {likers.map((liker) => (
                    <div
                      key={liker.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50"
                    >
                      <AvatarDisplay
                        avatarType={liker.avatar_type}
                        avatarColor={liker.avatar_color}
                        size="small"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {liker.display_name || liker.username}
                        </p>
                        {liker.display_name && (
                          <p className="text-sm text-gray-500 truncate">
                            @{liker.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
