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

      {/* Visual demo - mini calendar with multiple shift colors */}
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
          {/* Days 1-14 with varied shift colors */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => {
            // Demo colors: 7=blue (call), 8=teal (day off), 14=purple (work)
            let bg = '';
            let textColor = 'text-gray-600';
            if (day === 7) { bg = 'background-color: #0ea5e9'; textColor = 'text-white font-medium'; }
            if (day === 8) { bg = 'background-color: #14b8a6'; textColor = 'text-white font-medium'; }
            if (day === 14) { bg = 'background-color: #a855f7'; textColor = 'text-white font-medium'; }

            return (
              <div
                key={day}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${textColor}`}
                style={bg ? { backgroundColor: bg.split(': ')[1] } : undefined}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-500 mt-4">
        Choose your work pattern in Settings
      </p>
    </div>
  );
}
