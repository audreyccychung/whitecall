// Comments modal - bottom sheet for viewing and adding comments
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { ActivityComment, GetCommentsCode, AddCommentCode, DeleteCommentCode } from '../types/database';

interface CommentsModalProps {
  activityId: string | null;
  onClose: () => void;
  onCommentCountChange?: (activityId: string, delta: number) => void;
}

// Exhaustive mapping for get_activity_comments
const GET_COMMENTS_MESSAGES: Record<GetCommentsCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Activity not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_FRIENDS: 'You can only view comments from friends.',
  UNKNOWN_ERROR: 'Could not load comments.',
};

// Exhaustive mapping for add_activity_comment
const ADD_COMMENT_MESSAGES: Record<AddCommentCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Activity not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_FRIENDS: 'You can only comment on friends\' activities.',
  CANNOT_COMMENT_OWN: 'You cannot comment on your own activity.',
  CONTENT_TOO_LONG: 'Comment must be 280 characters or less.',
  CONTENT_EMPTY: 'Comment cannot be empty.',
  UNKNOWN_ERROR: 'Could not add comment.',
};

// Exhaustive mapping for delete_activity_comment
const DELETE_COMMENT_MESSAGES: Record<DeleteCommentCode, string> = {
  SUCCESS: '',
  NOT_FOUND: 'Comment not found.',
  UNAUTHORIZED: 'You must be logged in.',
  NOT_OWN_COMMENT: 'You can only delete your own comments.',
  UNKNOWN_ERROR: 'Could not delete comment.',
};

const MAX_COMMENT_LENGTH = 280;

// Format relative time (e.g., "2h ago", "1d ago")
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

export function CommentsModal({ activityId, onClose, onCommentCountChange }: CommentsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadComments = useCallback(async () => {
    if (!activityId) return;

    setLoading(true);
    setError(null);

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
      setLoading(false);
    }
  }, [activityId]);

  // Load comments when modal opens
  useEffect(() => {
    if (activityId) {
      loadComments();
      // Focus input after load
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when modal closes
      setComments([]);
      setError(null);
      setNewComment('');
      setSubmitError(null);
    }
  }, [activityId, loadComments]);

  // Handle submit comment
  const handleSubmit = async () => {
    if (!activityId || !newComment.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('add_activity_comment', {
        p_activity_id: activityId,
        p_content: newComment.trim(),
      });

      if (rpcError) throw rpcError;

      const result = data as { code: AddCommentCode; comment_id?: string; message?: string };

      if (result.code !== 'SUCCESS') {
        setSubmitError(ADD_COMMENT_MESSAGES[result.code] || ADD_COMMENT_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      // Clear input and reload comments
      setNewComment('');
      await loadComments();

      // Notify parent of comment count change
      if (onCommentCountChange) {
        onCommentCountChange(activityId, 1);
      }
    } catch {
      setSubmitError(ADD_COMMENT_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

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

      // Notify parent of comment count change
      if (onCommentCountChange && activityId) {
        onCommentCountChange(activityId, -1);
      }
    } catch {
      setSubmitError(DELETE_COMMENT_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  const charCount = newComment.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;

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
                Comments
              </h2>
            </div>

            {/* Comments list - scrollable */}
            <div className="flex-1 overflow-y-auto px-6">
              {loading ? (
                <div className="py-6 text-center">
                  <div className="w-8 h-8 border-3 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : error ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-gray-500">No comments yet</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
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

            {/* Input area - fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 modal-safe-bottom">
              {submitError && (
                <p className="text-sm text-red-500 mb-2">{submitError}</p>
              )}
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={1}
                    className={`w-full px-4 py-2 pr-14 border rounded-2xl resize-none focus:outline-none focus:ring-2 ${
                      isOverLimit
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-sky-soft-200'
                    }`}
                    style={{ minHeight: '40px', maxHeight: '100px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                    }}
                  />
                  {/* Character counter */}
                  <span className={`absolute right-3 bottom-2 text-xs ${
                    isOverLimit ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {charCount}/{MAX_COMMENT_LENGTH}
                  </span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isOverLimit || submitting}
                  className={`px-4 py-2 rounded-full font-medium transition-colors flex-shrink-0 ${
                    !newComment.trim() || isOverLimit || submitting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-sky-soft-500 text-white hover:bg-sky-soft-600'
                  }`}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
