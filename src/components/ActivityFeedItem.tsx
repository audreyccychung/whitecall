// Activity feed item - displays a single activity with like button
import { useState } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { RatingIcon } from './RatingIcon';
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

interface ActivityFeedItemProps {
  activity: Activity;
  onToggleLike: (activityId: string) => Promise<{ success: boolean }>;
}

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

export function ActivityFeedItem({ activity, onToggleLike }: ActivityFeedItemProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(activity.user_has_liked ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(activity.like_count);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic update
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    const result = await onToggleLike(activity.id);

    if (!result.success) {
      // Rollback on failure
      setLocalLiked(wasLiked);
      setLocalLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }

    setIsLiking(false);
  };

  const rating = activity.metadata.rating as CallRatingValue;
  const ratingLabel = RATING_LABEL[rating] || rating;
  const hoursSlept = activity.metadata.hours_slept;
  const displayName = activity.display_name || activity.username || 'Friend';

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
      {/* Avatar */}
      <AvatarDisplay
        avatarType={activity.avatar_type || 'cat'}
        avatarColor={activity.avatar_color || '#94a3b8'}
        size="small"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{displayName}</span>
          <span className="text-gray-400 text-sm">{formatRelativeTime(activity.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-600 text-sm">Rated their call</span>
          <RatingIcon rating={rating} size="sm" />
          <span className="text-gray-700 text-sm font-medium">{ratingLabel}</span>
          {hoursSlept !== null && hoursSlept !== undefined && (
            <span className="text-gray-500 text-sm">
              · {hoursSlept}h sleep
            </span>
          )}
        </div>
      </div>

      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={isLiking}
        className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
          localLiked
            ? 'text-red-500 bg-red-50'
            : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
        }`}
        aria-label={localLiked ? 'Unlike' : 'Like'}
      >
        <HeartIcon filled={localLiked} className={isLiking ? 'animate-pulse' : ''} />
        {localLikeCount > 0 && (
          <span className="text-sm font-medium">{localLikeCount}</span>
        )}
      </button>
    </div>
  );
}
