// Activity feed - displays friends' activities with like and comment support
import { useState } from 'react';
import { ActivityFeedItem } from './ActivityFeedItem';
import { LikersModal } from './LikersModal';
import { CommentsModal } from './CommentsModal';
import { useActivityFeed } from '../hooks/useActivityFeed';

// Refresh icon SVG
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

interface ActivityFeedProps {
  userId: string | undefined;
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const { activities, isLoading, error, toggleLike, refetch } = useActivityFeed(userId);
  const [selectedActivityForLikers, setSelectedActivityForLikers] = useState<string | null>(null);
  const [selectedActivityForComments, setSelectedActivityForComments] = useState<string | null>(null);
  // Track comment count deltas for optimistic updates (activityId -> delta)
  const [commentCountDeltas, setCommentCountDeltas] = useState<Record<string, number>>({});

  // Handle comment count change from modal
  const handleCommentCountChange = (activityId: string, delta: number) => {
    setCommentCountDeltas((prev) => ({
      ...prev,
      [activityId]: (prev[activityId] || 0) + delta,
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Support Feed</h2>
        </div>
        <div className="flex justify-center py-8">
          <RefreshIcon className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Support Feed</h2>
          <button
            onClick={refetch}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
        <p className="text-center text-gray-500 py-4">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Support Feed</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-4xl mb-2">🤫</p>
          <p className="text-gray-500 text-sm">
            No activity yet. When your friends rate their calls, you'll see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Support Feed</h2>
        <button
          onClick={refetch}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Refresh feed"
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityFeedItem
            key={activity.id}
            activity={activity}
            onToggleLike={toggleLike}
            onLikeCountClick={(id) => setSelectedActivityForLikers(id)}
            onCommentClick={(id) => setSelectedActivityForComments(id)}
            commentCountDelta={commentCountDeltas[activity.id] || 0}
          />
        ))}
      </div>

      {/* Likers Modal */}
      <LikersModal
        activityId={selectedActivityForLikers}
        onClose={() => setSelectedActivityForLikers(null)}
      />

      {/* Comments Modal */}
      <CommentsModal
        activityId={selectedActivityForComments}
        onClose={() => setSelectedActivityForComments(null)}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
}
