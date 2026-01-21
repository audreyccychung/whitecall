// Bar-based trend chart: sleep bars with mood emoji overlay
// Strava-inspired: calm, glanceable, mobile-first
import type { TrendPoint } from '../../hooks/useProfileStats';

interface TrendChartProps {
  data: TrendPoint[];
}

// Mood emoji mapping (1-4 scale)
const MOOD_EMOJI: Record<number, string> = {
  1: '😫',
  2: '😐',
  3: '😊',
  4: '✨',
};

// Bar color by mood (subtle tints)
const MOOD_COLORS: Record<number, string> = {
  1: 'bg-red-200',    // rough - muted red
  2: 'bg-gray-300',   // okay - neutral gray
  3: 'bg-emerald-200', // good - soft green
  4: 'bg-emerald-300', // great - brighter green
};

// Calculate dynamic ceiling based on max sleep in data
// Rounds up to next "nice" number (5, 6, 7, 8, 10, 12)
function calculateCeiling(maxSleep: number): number {
  if (maxSleep <= 4) return 5;
  if (maxSleep <= 5) return 6;
  if (maxSleep <= 6) return 7;
  if (maxSleep <= 7) return 8;
  if (maxSleep <= 9) return 10;
  return 12;
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length < 3) {
    return (
      <div className="bg-white rounded-2xl shadow-soft-lg p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Trends</h3>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            Rate {3 - data.length} more {3 - data.length === 1 ? 'call' : 'calls'} to see trends
          </p>
        </div>
      </div>
    );
  }

  // Calculate dynamic Y-axis ceiling based on actual data
  const maxSleepInData = Math.max(...data.map(p => p.sleep ?? 0));
  const ceiling = calculateCeiling(maxSleepInData);

  // Format date for display (e.g., "Jan 5")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft-lg p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Recent Trends</h3>

      {/* Bar chart container */}
      <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
        {/* Y-axis label */}
        <div className="flex flex-col justify-between h-full text-xs text-gray-400 pr-1 pb-5">
          <span>{ceiling}h</span>
          <span>0</span>
        </div>

        {/* Bars */}
        {data.map((point, i) => {
          const sleepHours = point.sleep ?? 0;
          const heightPercent = Math.min((sleepHours / ceiling) * 100, 100);
          const moodColor = MOOD_COLORS[point.mood] || 'bg-gray-300';
          const emoji = MOOD_EMOJI[point.mood] || '😐';

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {/* Emoji above bar */}
              <span className="text-base" title={`${MOOD_EMOJI[point.mood]} mood`}>
                {emoji}
              </span>

              {/* Bar container (fixed height for alignment) */}
              <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                {/* Sleep bar */}
                <div
                  className={`w-full rounded-t-md ${moodColor} transition-all duration-300`}
                  style={{
                    height: `${Math.max(heightPercent, 4)}%`,
                    minHeight: sleepHours > 0 ? 4 : 0,
                  }}
                  title={`${sleepHours}h sleep`}
                />
              </div>

              {/* Date label */}
              <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                {formatDate(point.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Subtle footer hint */}
      <p className="text-xs text-gray-400 text-center mt-3">
        Sleep hours · Mood emoji
      </p>
    </div>
  );
}
