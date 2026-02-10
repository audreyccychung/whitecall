// Activity feed item - displays a single activity with like and comment buttons
import { useState } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { RatingIcon } from './RatingIcon';
import { formatRelativeTime } from '../utils/date';
import type { Activity, CallRatingValue } from '../types/database';
import { RATING_LABEL } from '../types/database';

// Heart SVG icon component
function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// Comment SVG icon component
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

interface ActivityFeedItemProps {
  activity: Activity;
  onToggleLike: (activityId: string) => Promise<{ success: boolean }>;
  onLikeCountClick?: (activityId: string) => void;
  onCommentClick?: (activityId: string) => void;
}

export function ActivityFeedItem({
  activity,
  onToggleLike,
  onLikeCountClick,
  onCommentClick,
}: ActivityFeedItemProps) {
  const [isLiking, setIsLiking] = useState(false);

  // Display state directly from activity prop (single source of truth from backend)
  const liked = activity.user_has_liked ?? false;
  const likeCount = activity.like_count;
  const commentCount = activity.comment_count;

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    await onToggleLike(activity.id);
    setIsLiking(false);
  };

  const rating = activity.metadata.rating as CallRatingValue;
  const ratingLabel = RATING_LABEL[rating] || rating;
  const hoursSlept = activity.metadata.hours_slept;
  const notes = activity.metadata.notes;
  const displayName = activity.display_name || activity.username || 'Friend';

  // Handle clicking the like count to show likers
  const handleLikeCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeCount > 0 && onLikeCountClick) {
      onLikeCountClick(activity.id);
    }
  };

  // Handle clicking comment button or count
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCommentClick) {
      onCommentClick(activity.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      {/* Top row: Avatar + Name + Time */}
      <div className="flex items-center gap-3">
        <AvatarDisplay
          avatarType={activity.avatar_type || 'cat'}
          avatarColor={activity.avatar_color || '#94a3b8'}
          size="small"
        />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900 truncate block">{displayName}</span>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0">{formatRelativeTime(activity.created_at)}</span>
      </div>

      {/* Rating row */}
      <div className="flex items-center gap-2 mt-2.5 ml-11">
        <span className="text-gray-500 text-sm">Rated</span>
        <RatingIcon rating={rating} size="sm" />
        <span className="text-gray-800 text-sm font-medium">{ratingLabel}</span>
        {hoursSlept !== null && hoursSlept !== undefined && (
          <span className="text-gray-400 text-sm">
            · {hoursSlept}h sleep
          </span>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <p className="text-sm text-gray-500 mt-2 ml-11 line-clamp-2 italic">
          "{notes}"
        </p>
      )}

      {/* Action buttons - bottom row, aligned with content */}
      <div className="flex items-center gap-4 mt-2.5 ml-11">
        {/* Like button */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`p-1.5 rounded-full transition-colors ${
              liked
                ? 'text-red-500 bg-red-50'
                : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
            }`}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <HeartIcon filled={liked} className={isLiking ? 'animate-pulse' : ''} />
          </button>
          {likeCount > 0 && (
            <button
              onClick={handleLikeCountClick}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline min-w-[16px]"
              aria-label="View who liked this"
            >
              {likeCount}
            </button>
          )}
        </div>

        {/* Comment button */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCommentClick}
            className="p-1.5 rounded-full transition-colors text-gray-400 hover:text-sky-soft-500 hover:bg-sky-soft-50"
            aria-label="View comments"
          >
            <CommentIcon />
          </button>
          {commentCount > 0 && (
            <button
              onClick={handleCommentClick}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline min-w-[16px]"
              aria-label="View comments"
            >
              {commentCount}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
