// Simple trend chart showing mood and sleep over recent calls
import type { TrendPoint } from '../../hooks/useProfileStats';

interface TrendChartProps {
  data: TrendPoint[];
  showSleep?: boolean;
}

// Mood emoji mapping
const MOOD_EMOJI = ['', '😫', '😐', '😊', '✨'];

export function TrendChart({ data, showSleep = true }: TrendChartProps) {
  if (data.length < 3) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">
          Rate {3 - data.length} more {3 - data.length === 1 ? 'call' : 'calls'} to see trends
        </p>
      </div>
    );
  }

  // Chart dimensions
  const chartHeight = 80;
  const padding = 8;
  const pointRadius = 4;

  // Calculate Y positions (mood: 1-4 scale, sleep: 0-12 scale)
  const moodToY = (mood: number) => {
    // Invert because SVG Y increases downward
    const normalized = (mood - 1) / 3; // 0-1
    return chartHeight - padding - normalized * (chartHeight - padding * 2);
  };

  const sleepToY = (sleep: number) => {
    const normalized = sleep / 12; // 0-1
    return chartHeight - padding - normalized * (chartHeight - padding * 2);
  };

  // Calculate X positions (evenly spaced)
  const getX = (index: number) => {
    if (data.length === 1) return 50;
    return padding + (index / (data.length - 1)) * (100 - padding * 2);
  };

  // Build path strings
  const moodPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${moodToY(p.mood)}`)
    .join(' ');

  const sleepPath = data
    .filter(p => p.sleep !== null)
    .map((p, i) => {
      const originalIndex = data.indexOf(p);
      return `${i === 0 ? 'M' : 'L'} ${getX(originalIndex)} ${sleepToY(p.sleep!)}`;
    })
    .join(' ');

  const hasSleepData = showSleep && data.some(p => p.sleep !== null);

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Recent Trends</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-soft-500" />
            Mood
          </span>
          {hasSleepData && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Sleep
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <line
            x1={padding}
            y1={chartHeight / 2}
            x2={100 - padding}
            y2={chartHeight / 2}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />

          {/* Sleep line (if data exists) */}
          {hasSleepData && sleepPath && (
            <path
              d={sleepPath}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Mood line */}
          <path
            d={moodPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Mood points */}
          {data.map((p, i) => (
            <circle
              key={`mood-${i}`}
              cx={getX(i)}
              cy={moodToY(p.mood)}
              r={pointRadius}
              fill="#38bdf8"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Sleep points */}
          {hasSleepData && data.map((p, i) => (
            p.sleep !== null && (
              <circle
                key={`sleep-${i}`}
                cx={getX(i)}
                cy={sleepToY(p.sleep)}
                r={pointRadius}
                fill="#c084fc"
                vectorEffect="non-scaling-stroke"
              />
            )
          ))}
        </svg>
      </div>

      {/* X-axis labels (mood emojis) */}
      <div className="flex justify-between mt-2 px-1">
        {data.map((p, i) => (
          <span key={i} className="text-sm" title={p.date}>
            {MOOD_EMOJI[p.mood]}
          </span>
        ))}
      </div>
    </div>
  );
}
