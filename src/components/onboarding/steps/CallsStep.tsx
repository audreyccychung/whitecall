// Calls step - explain marking shift days
export function CallsStep() {
  return (
    <div className="text-center">
      {/* Emoji header */}
      <div className="text-6xl mb-4">📅</div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">Mark Your Schedule</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Tap dates to add calls, shifts, or days off so friends can see your schedule
      </p>

      {/* Visual demo - mini calendar with V2.0 calm styling */}
      <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-xs">
        <div className="text-xs text-gray-500 mb-2 font-medium">January 2026</div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-gray-400 text-center py-1">{day}</div>
          ))}
          {/* Empty cells for offset */}
          {[...Array(3)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Days 1-14 with calm tint + bracket styling */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => {
            // Demo: 7=blue (call), 8=teal (day off), 14=purple (work)
            let style: React.CSSProperties | undefined;
            let textClass = 'text-gray-600';

            if (day === 7) {
              style = { backgroundColor: '#38bdf814', boxShadow: 'inset 3px 0 0 0 #38bdf8' };
              textClass = 'text-gray-800 font-semibold';
            }
            if (day === 8) {
              style = { backgroundColor: '#2dd4bf14', boxShadow: 'inset 3px 0 0 0 #2dd4bf' };
              textClass = 'text-gray-800 font-semibold';
            }
            if (day === 14) {
              style = { backgroundColor: '#a855f714', boxShadow: 'inset 3px 0 0 0 #a855f7' };
              textClass = 'text-gray-800 font-semibold';
            }

            return (
              <div
                key={day}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm ${textClass}`}
                style={style}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Captions */}
      <p className="text-sm text-gray-500 mt-4">
        Choose your work pattern in Settings
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Long-press a past call to rate it
      </p>
    </div>
  );
}
