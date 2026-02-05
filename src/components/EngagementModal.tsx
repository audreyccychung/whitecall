// Engagement modal - bottom sheet showing both likers and comments for Profile page
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type {
  ActivityLiker,
  GetLikersCode,
  ActivityComment,
  GetCommentsCode,
  DeleteCommentCode,
} from '../types/database';

interface EngagementModalProps {
  activityId: string | null;
  onClose: () => void;
}

// Exhaustive mappings
const GET_LIKERS_MESSAGES: Record<GetLikersCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Activity not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_FRIENDS: 'You can only view likes from friends.',
  UNKNOWN_ERROR: 'Could not load likes.',
};

const GET_COMMENTS_MESSAGES: Record<GetCommentsCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Activity not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_FRIENDS: 'You can only view comments from friends.',
  UNKNOWN_ERROR: 'Could not load comments.',
};

const DELETE_COMMENT_MESSAGES: Record<DeleteCommentCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Comment not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_OWN_COMMENT: 'You can only delete your own comments.',
  UNKNOWN_ERROR: 'Could not delete comment.',
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function EngagementModal({ activityId, onClose }: EngagementModalProps) {
  const { user } = useAuth();
  const [likers, setLikers] = useState<ActivityLiker[]>([]);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load likers
  const loadLikers = useCallback(async () => {
    if (!activityId) return;

    setLoadingLikers(true);
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
      setLoadingLikers(false);
    }
  }, [activityId]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!activityId) return;

    setLoadingComments(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_activity_comments', {
        p_activity_id: activityId,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: GetCommentsCode; comments?: ActivityComment[]; message?: string };

      if (result.code !== 'SUCCESS') {
        setError(GET_COMMENTS_MESSAGES[result.code] || GET_COMMENTS_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      setComments(result.comments || []);
    } catch {
      setError(GET_COMMENTS_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setLoadingComments(false);
    }
  }, [activityId]);

  // Load data when modal opens
  useEffect(() => {
    if (activityId) {
      setError(null);
      loadLikers();
      loadComments();
    } else {
      // Reset state when modal closes
      setLikers([]);
      setComments([]);
      setError(null);
      setSubmitError(null);
    }
  }, [activityId, loadLikers, loadComments]);

  // Note: Comments are disabled on own activities - this modal only shows engagement
  // The input is hidden since user can't comment on their own activity

  // Handle delete comment
  const handleDelete = async (commentId: string) => {
    if (deletingId) return;

    setDeletingId(commentId);

    try {
      const { data, error: rpcError } = await supabase.rpc('delete_activity_comment', {
        p_comment_id: commentId,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: DeleteCommentCode; message?: string };

      if (result.code !== 'SUCCESS') {
        setSubmitError(DELETE_COMMENT_MESSAGES[result.code] || DELETE_COMMENT_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      // Remove from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setSubmitError(DELETE_COMMENT_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  const isLoading = loadingLikers || loadingComments;

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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
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

            {/* Header */}
            <div className="px-6 pt-2 pb-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                Engagement
              </h2>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 modal-safe-bottom">
              {isLoading ? (
                <div className="py-6 text-center">
                  <div className="w-8 h-8 border-3 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : error ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Likers section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Liked by ({likers.length})
                    </h3>
                    {likers.length === 0 ? (
                      <p className="text-gray-400 text-sm py-2">No likes yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {likers.map((liker) => (
                          <div
                            key={liker.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50"
                            title={liker.display_name || liker.username}
                          >
                            <AvatarDisplay
                              avatarType={liker.avatar_type}
                              avatarColor={liker.avatar_color}
                              size="tiny"
                            />
                            <span className="text-sm text-gray-700 truncate max-w-[100px]">
                              {liker.display_name || liker.username}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comments section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Comments ({comments.length})
                    </h3>
                    {submitError && (
                      <p className="text-sm text-red-500 mb-2">{submitError}</p>
                    )}
                    {comments.length === 0 ? (
                      <p className="text-gray-400 text-sm py-2">No comments yet</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start gap-3 px-3 py-3 rounded-xl bg-gray-50"
                          >
                            <AvatarDisplay
                              avatarType={comment.avatar_type || 'cat'}
                              avatarColor={comment.avatar_color || '#94a3b8'}
                              size="small"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 truncate">
                                  {comment.display_name || comment.username}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {formatRelativeTime(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>
                            </div>
                            {/* Delete button - only show for own comments */}
                            {user?.id === comment.user_id && (
                              <button
                                onClick={() => handleDelete(comment.id)}
                                disabled={deletingId === comment.id}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                                aria-label="Delete comment"
                              >
                                {deletingId === comment.id ? (
                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
