// Support summary: hearts received, support %, streak
interface SupportSummaryProps {
  allTimeHearts: number;
  callsWithHeartsPercent: number | null;
  currentStreak: number;
  longestStreak: number;
}

export function SupportSummary({
  allTimeHearts,
  callsWithHeartsPercent,
  currentStreak,
  longestStreak,
}: SupportSummaryProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-3">Support</h4>
      <div className="space-y-2.5">
        {/* Hearts received */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🤍</span>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {allTimeHearts} heart{allTimeHearts !== 1 ? 's' : ''} received
            </p>
            {callsWithHeartsPercent !== null && (
              <p className="text-xs text-gray-500">
                Friends supported {Math.round(callsWithHeartsPercent)}% of your calls
              </p>
            )}
          </div>
        </div>

        {/* Streak */}
        {(currentStreak > 0 || longestStreak > 0) && (
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              {currentStreak > 0 && (
                <p className="text-sm font-medium text-gray-800">
                  {currentStreak} day streak
                </p>
              )}
              {longestStreak > 0 && longestStreak !== currentStreak && (
                <p className="text-xs text-gray-500">
                  Longest: {longestStreak} days
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
