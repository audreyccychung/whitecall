// Group leaderboard - shows which members send the most hearts
import { useGroupLeaderboard } from '../hooks/useGroupLeaderboard';
import { AvatarDisplay } from './AvatarDisplay';
import type { LeaderboardEntry } from '../types/group';

// Medal for top 3
function getMedal(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
}

function LeaderboardRow({ entry, rank }: LeaderboardRowProps) {
  const medal = getMedal(rank);

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Rank or medal */}
      <div className="w-6 text-center flex-shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-sm text-gray-400">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <AvatarDisplay
        avatarType={entry.avatar_type}
        avatarColor={entry.avatar_color}
        size="small"
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {entry.display_name || entry.username}
        </p>
      </div>

      {/* Hearts sent */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">{entry.hearts_sent}</span>
        <span className="text-pink-400">🤍</span>
      </div>
    </div>
  );
}

interface GroupLeaderboardProps {
  groupId: string;
}

export function GroupLeaderboard({ groupId }: GroupLeaderboardProps) {
  const { leaderboard, loading, error } = useGroupLeaderboard(groupId, 7);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  // Show top 5
  const topFive = leaderboard.slice(0, 5);

  if (topFive.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-1">🤍</p>
        <p className="text-sm text-gray-500">No hearts sent this week yet.</p>
      </div>
    );
  }

  // Check if anyone sent hearts
  const anyHeartsSent = topFive.some((e) => e.hearts_sent > 0);

  if (!anyHeartsSent) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-1">🤍</p>
        <p className="text-sm text-gray-500">No hearts sent this week yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {topFive.map((entry, index) => (
        <LeaderboardRow key={entry.user_id} entry={entry} rank={index + 1} />
      ))}
    </div>
  );
}
