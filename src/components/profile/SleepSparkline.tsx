// SVG sparkline: sleep hours over last 20 rated calls, dots colored by mood
import type { TrendPoint } from '../../hooks/useProfileStats';

const MOOD_FILL: Record<number, string> = {
  1: '#1f2937', // rough = black
  2: '#6b7280', // okay = dark gray
  3: '#d1d5db', // good = light gray
  4: '#ffffff', // great = white
};

const MOOD_STROKE: Record<number, string> = {
  1: '#1f2937',
  2: '#6b7280',
  3: '#d1d5db',
  4: '#9ca3af', // white dot needs visible border
};

interface SleepSparklineProps {
  data: TrendPoint[];
  avgSleep: number | null;
}

export function SleepSparkline({ data, avgSleep }: SleepSparklineProps) {
  // Filter to points with sleep data
  const points = data.filter(p => p.sleep !== null);

  if (points.length < 3) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">
          Rate {3 - points.length} more {3 - points.length === 1 ? 'call' : 'calls'} to see sleep trends
        </p>
      </div>
    );
  }

  const maxSleep = Math.max(...points.map(p => p.sleep!));
  const ceiling = maxSleep <= 4 ? 5 : maxSleep <= 6 ? 7 : maxSleep <= 8 ? 9 : 12;

  // SVG dimensions — leave room for Y-axis labels on the left
  const width = 300;
  const height = 88;
  const labelW = 28; // space for "8h" labels
  const padX = 6;
  const padY = 6;
  const chartL = labelW + 4; // chart starts after labels
  const chartW = width - chartL - padX;
  const chartH = height - padY * 2;

  // Y-axis tick values: 0, midpoint, ceiling
  const midTick = Math.round(ceiling / 2);
  const yTicks = [0, midTick, ceiling];

  // Map data to SVG coordinates
  const coords = points.map((p, i) => ({
    x: chartL + (i / (points.length - 1)) * chartW,
    y: padY + chartH - (p.sleep! / ceiling) * chartH,
    mood: p.mood,
  }));

  // Build polyline path
  const linePath = coords.map(c => `${c.x},${c.y}`).join(' ');

  // Average sleep Y position
  const avgY = avgSleep !== null
    ? padY + chartH - (avgSleep / ceiling) * chartH
    : null;

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-2">Sleep Over Time</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 88 }}>
        {/* Y-axis labels and gridlines */}
        {yTicks.map((tick) => {
          const y = padY + chartH - (tick / ceiling) * chartH;
          return (
            <g key={tick}>
              <text
                x={labelW - 2}
                y={y + 3}
                textAnchor="end"
                fill="#9ca3af"
                fontSize={9}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {tick}h
              </text>
              <line
                x1={chartL}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={0.75}
              />
            </g>
          );
        })}

        {/* Average line */}
        {avgY !== null && (
          <line
            x1={chartL}
            y1={avgY}
            x2={width - padX}
            y2={avgY}
            stroke="#d1d5db"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Line connecting dots */}
        <polyline
          points={linePath}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Dots */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={4}
            fill={MOOD_FILL[c.mood] || '#d1d5db'}
            stroke={MOOD_STROKE[c.mood] || '#9ca3af'}
            strokeWidth={1.5}
          />
        ))}
      </svg>
      <p className="text-xs text-gray-400 text-center mt-1">
        Avg {avgSleep !== null ? `${avgSleep.toFixed(1)}h` : '-'} · {points.length} calls
      </p>
    </div>
  );
}
