// Vertical bar chart: call count by day of week (Mon-Sun)
interface DayOfWeekChartProps {
  callsByDay: number[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

export function DayOfWeekChart({ callsByDay }: DayOfWeekChartProps) {
  const maxCount = Math.max(...callsByDay);
  const total = callsByDay.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">Log calls to see patterns</p>
      </div>
    );
  }

  // Find busiest day
  const busiestIdx = callsByDay.indexOf(maxCount);
  const busiestDay = DAY_NAMES[busiestIdx];

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-3">Day of Week</h4>

      <div className="flex items-end justify-between gap-1.5" style={{ height: 80 }}>
        {callsByDay.map((count, i) => {
          const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isBusiest = i === busiestIdx && count > 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: 52 }}>
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isBusiest ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                  style={{
                    height: `${Math.max(heightPercent, count > 0 ? 6 : 0)}%`,
                    minHeight: count > 0 ? 3 : 0,
                  }}
                />
              </div>
              {/* Count */}
              <span className={`text-xs ${isBusiest ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                {count}
              </span>
              {/* Day label */}
              <span className={`text-xs ${isBusiest ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        {busiestDay} are your busiest
      </p>
    </div>
  );
}
