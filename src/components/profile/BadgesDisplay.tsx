// Simple badges display - shows earned/unearned badges
import type { Badge } from '../../hooks/useBadges';

interface BadgesDisplayProps {
  badges: Badge[];
}

export function BadgesDisplay({ badges }: BadgesDisplayProps) {
  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);

  if (earnedBadges.length === 0 && unearnedBadges.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft-lg p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Badges</h3>

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
              title={badge.description}
            >
              <span className="text-xl">{badge.emoji}</span>
              <span className="text-sm font-medium text-amber-800">{badge.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Unearned badges - grayed out */}
      {unearnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {unearnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl opacity-50"
              title={badge.description}
            >
              <span className="text-xl grayscale">{badge.emoji}</span>
              <span className="text-sm font-medium text-gray-500">{badge.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
